<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PlanDetail } from '../../../../types/production-plan/plan'

const props = defineProps<{
  loading:            boolean
  currentPlan:        any
  isEditable:         boolean
  fmtDate:            (d?: string | null) => string
  fmtNum:             (n?: number | null) => string
  overallStatusLabel: Record<string, string>
  overallStatusColor: Record<string, string>
  detailStatusColor:  (s?: string | null) => string
}>()

const ALL_VALUE = 'all'

// ─── Filter state ─────────────────────────────────────────────────────────────
const filterCustomer = ref<string>(ALL_VALUE)
const filterProduct  = ref<string>(ALL_VALUE)
const currentPage    = ref<number>(1)
const PAGE_SIZE      = 5

// ─── Derived: unique customer list from details ───────────────────────────────
const customerOptions = computed(() => {
  const map = new Map<number, string>()
  for (const d of (props.currentPlan?.details ?? [])) {
    if (d.customer?.id && d.customer?.name) {
      map.set(d.customer.id, d.customer.name)
    }
  }
  return [{ id: ALL_VALUE, name: 'All Customer' }, ...[...map.entries()].map(([id, name]) => ({ id: String(id), name }))]
})

// ─── Derived: unique product list (optionally filtered by customer) ───────────
const productOptions = computed(() => {
  const map = new Map<number, string>()
  for (const d of (props.currentPlan?.details ?? [])) {
    if (filterCustomer.value !== ALL_VALUE && String(d.customer?.id) !== filterCustomer.value) continue
    if (d.part?.id) {
      map.set(d.part.id, `${d.part.part_number} – ${d.part.part_name}`)
    }
  }
  return [{ id: ALL_VALUE, label: 'All Product' }, ...[...map.entries()].map(([id, label]) => ({ id: String(id), label }))]
})

// ─── Filtered details ─────────────────────────────────────────────────────────
const filteredDetails = computed<PlanDetail[]>(() => {
  let list: PlanDetail[] = props.currentPlan?.details ?? []

  if (filterCustomer.value !== ALL_VALUE) {
    list = list.filter(d => String(d.customer?.id) === filterCustomer.value)
  }
  if (filterProduct.value !== ALL_VALUE) {
    list = list.filter(d => String(d.part?.id) === filterProduct.value)
  }
  return list
})

// ─── Pagination ───────────────────────────────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(filteredDetails.value.length / PAGE_SIZE)))

const pagedDetails = computed<PlanDetail[]>(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredDetails.value.slice(start, start + PAGE_SIZE)
})

// Reset ke halaman 1 saat filter berubah
function onFilterChange() {
  currentPage.value = 1
  // Reset filter produk saat customer berubah
}
function onCustomerChange() {
  filterProduct.value = ALL_VALUE
  currentPage.value   = 1
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCapacity(detail: PlanDetail): number | null {
  return detail.qty_capacity ?? null
}

function getGap(detail: PlanDetail): number | null {
  return detail.capacity_gap ?? null
}

// Urutan baris aktual di seluruh filtered list (bukan per-halaman)
function rowIndex(detail: PlanDetail): number {
  return filteredDetails.value.indexOf(detail) + 1
}
</script>

<template>
  <div class="mt-4 bg-default border border-default rounded-xl">

    <!-- Header + status badge -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-default">
      <div>
        <h3 class="font-semibold text-sm flex items-center gap-2">
          <UIcon name="i-lucide-list" class="w-4 h-4 text-primary" />
          Request Details
        </h3>
        <p class="text-xs text-muted mt-0.5">
          Products requested from Delivery Orders. Lines are auto-assigned from part routing.
        </p>
      </div>
      <UBadge
        v-if="currentPlan?.overall_status"
        :label="overallStatusLabel[currentPlan.overall_status]"
        :color="overallStatusColor[currentPlan.overall_status]"
        variant="soft"
      />
    </div>

    <!-- Filter bar -->
    <div class="px-5 py-3 border-b border-default bg-elevated/40 flex flex-wrap items-center gap-3">
      <!-- Customer filter -->
      <div class="flex items-center gap-2 min-w-[200px]">
        <UIcon name="i-lucide-building-2" class="w-3.5 h-3.5 text-muted flex-shrink-0" />
        <USelect
          v-model="filterCustomer"
          :items="customerOptions"
          value-key="id"
          label-key="name"
          size="sm"
          class="w-full"
          placeholder="All Customers"
          @change="onCustomerChange"
        />
      </div>

      <!-- Product filter -->
      <div class="flex items-center gap-2 min-w-[240px]">
        <UIcon name="i-lucide-package" class="w-3.5 h-3.5 text-muted flex-shrink-0" />
        <USelect
          v-model="filterProduct"
          :items="productOptions"
          value-key="id"
          label-key="label"
          size="sm"
          class="w-full"
          placeholder="All Products"
          @change="onFilterChange"
        />
      </div>

      <!-- Clear filters -->
      <UButton
        v-if="filterCustomer !== ALL_VALUE || filterProduct !== ALL_VALUE"
        label="Reset"
        icon="i-lucide-x"
        variant="ghost"
        color="neutral"
        size="sm"
        @click="filterCustomer = ALL_VALUE; filterProduct = ALL_VALUE; currentPage = 1"
      />

      <!-- Result count -->
      <p class="text-xs text-muted ml-auto">
        {{ filteredDetails.length }} from {{ currentPlan?.details?.length ?? 0 }} item
      </p>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-elevated border-b border-default">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">No</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Customer</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Product</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Delivery Date</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Requested Qty</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Capacity</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Gap</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Production Line</th>
            <th class="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <!-- Loading state -->
          <tr v-if="loading">
            <td colspan="9" class="text-center py-10 text-muted">
              <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin inline-block mr-2" />
              Loading data...
            </td>
          </tr>

          <!-- Empty from source -->
          <tr v-else-if="!currentPlan?.details?.length">
            <td colspan="9" class="text-center py-10 text-muted text-sm">
              No request details found.
            </td>
          </tr>

          <!-- Empty from filter -->
          <tr v-else-if="!filteredDetails.length">
            <td colspan="9" class="text-center py-10 text-muted text-sm">
              <UIcon name="i-lucide-search-x" class="w-5 h-5 inline-block mr-1.5 mb-0.5" />
              No data matches the current filter.
            </td>
          </tr>

          <!-- Data rows -->
          <tr
            v-for="detail in pagedDetails"
            :key="detail.id"
            class="hover:bg-elevated/50 transition-colors"
          >
            <td class="px-4 py-3 text-muted">{{ rowIndex(detail) }}</td>
            <td class="px-4 py-3 font-medium">{{ detail.customer?.name ?? '-' }}</td>
            <td class="px-4 py-3">
              <div class="font-medium">{{ detail.part?.part_name ?? '-' }}</div>
              <div class="text-xs text-muted font-mono">{{ detail.part?.part_number ?? '' }}</div>
            </td>
            <td class="px-4 py-3 text-muted">{{ fmtDate(detail.delivery_date) }}</td>
            <td class="px-4 py-3 text-right font-mono">{{ fmtNum(detail.qty_request) }}</td>
            <td class="px-4 py-3 text-right font-mono">
              <span
                :class="{
                  'text-success-600': getCapacity(detail) != null && getCapacity(detail)! >= detail.qty_request,
                  'text-error-600':   getCapacity(detail) != null && getCapacity(detail)! < detail.qty_request,
                  'text-muted':       getCapacity(detail) == null,
                }"
              >
                {{ getCapacity(detail) != null ? fmtNum(getCapacity(detail)) : '—' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right font-mono">
              <span
                v-if="getGap(detail) != null"
                :class="getGap(detail)! >= 0 ? 'text-success-600' : 'text-error-600'"
              >
                {{ getGap(detail)! >= 0 ? '+' : '' }}{{ fmtNum(getGap(detail)) }}
              </span>
              <span v-else class="text-muted">—</span>
            </td>
            <td class="px-4 py-3 min-w-[160px]">
              <span
                v-if="detail.assigned_line_id"
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border border-default"
                :class="{
                  'bg-success-50 border-success-200 text-success-700 dark:bg-success-950 dark:border-success-800 dark:text-success-400': detail.status === 'POSSIBLE',
                  'bg-error-50 border-error-200 text-error-700 dark:bg-error-950 dark:border-error-800 dark:text-error-400':           detail.status === 'IMPOSSIBLE',
                }"
              >
                {{ detail.assigned_line?.name ?? `Line #${detail.assigned_line_id}` }}
              </span>
              <span v-else class="text-xs text-warning-600 flex items-center gap-1">
                <UIcon name="i-lucide-alert-circle" class="w-3.5 h-3.5" />
                No routing
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <UBadge
                :label="
                  detail.status === 'POSSIBLE'    ? 'POSSIBLE'
                  : detail.status === 'IMPOSSIBLE' ? 'IMPOSSIBLE'
                    : 'Not Calculated'
                "
                :color="detailStatusColor(detail.status)"
                variant="soft"
                size="sm"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="filteredDetails.length > PAGE_SIZE"
      class="flex items-center justify-between px-5 py-3 border-t border-default"
    >
      <p class="text-xs text-muted">
        Page {{ currentPage }} from {{ totalPages }}
        &nbsp;·&nbsp;
        {{ filteredDetails.length }} item
      </p>
      <div class="flex items-center gap-1">
        <UButton
          icon="i-lucide-chevron-first"
          variant="ghost"
          color="neutral"
          size="xs"
          :disabled="currentPage === 1"
          @click="currentPage = 1"
        />
        <UButton
          icon="i-lucide-chevron-left"
          variant="ghost"
          color="neutral"
          size="xs"
          :disabled="currentPage === 1"
          @click="currentPage--"
        />
        <span class="text-xs font-mono px-2">{{ currentPage }} / {{ totalPages }}</span>
        <UButton
          icon="i-lucide-chevron-right"
          variant="ghost"
          color="neutral"
          size="xs"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        />
        <UButton
          icon="i-lucide-chevron-last"
          variant="ghost"
          color="neutral"
          size="xs"
          :disabled="currentPage === totalPages"
          @click="currentPage = totalPages"
        />
      </div>
    </div>
  </div>
</template>