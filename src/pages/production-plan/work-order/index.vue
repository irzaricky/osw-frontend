<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs }        from 'pinia'
import { useRouter }          from 'vue-router'
import { useDebounceFn }      from '@vueuse/core'
import { useWorkOrderStore }  from '../../../stores/production-plan/work-order.store'
import { useWorkOrderColumns } from './composables/useWorkOrderColumns'
import { useWorkOrderActions } from './composables/useWorkOrderActions'
import { useAppToast }        from '../../../composables/useAppToast'
import type { WorkOrder, WorkOrderStatus } from '../../../types/production-plan/work-order'
import type { Range }         from '../../../types'
import Breadcrumbs    from '../../../components/Breadcrumbs.vue'
import ConfirmDialog  from '../../../components/ConfirmDialog.vue'
import WOFilters      from './components/WOFilters.vue'
import WODailySummary from './components/WODailySummary.vue'

const router  = useRouter()
const woStore = useWorkOrderStore()
const { workOrders, meta, loading, dailySummary } = storeToRefs(woStore)

const table        = useTemplateRef('table')
const rowSelection = ref({})

const ui = {
  UCheckbox:     resolveComponent('UCheckbox') as any,
  UButton:       resolveComponent('UButton')   as any,
  UDropdownMenu: resolveComponent('UDropdownMenu') as any,
  UBadge:        resolveComponent('UBadge')    as any,
}

const pagination = computed(() => ({ page: meta.value.page, limit: meta.value.limit }))

const selectedCount = computed((): number =>
  (table.value as any)?.tableApi?.getFilteredSelectedRowModel().rows.length || 0,
)

// ── Filters ───────────────────────────────────────────────────────────────────

const search = ref('')

const today = new Date()
const filters = reactive({
  status:     undefined as WorkOrderStatus | undefined,
  date_range: { start: today, end: today } as Range | undefined,
  line_id:    undefined as number | undefined,
  shift_id:   undefined as number | undefined,
})

function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function resetFilters() {
  search.value        = ''
  filters.status      = undefined
  filters.date_range  = undefined
  filters.line_id     = undefined
  filters.shift_id    = undefined
  meta.value.page     = 1
  fetchData()
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchData() {
  const params: Record<string, any> = {
    page:    meta.value.page,
    limit:   meta.value.limit,
    search:  search.value || undefined,
    status:  filters.status,
    line_id: filters.line_id,
    shift_id: filters.shift_id,
  }
  if (filters.date_range?.start) params.start_date = formatLocalDate(filters.date_range.start)
  if (filters.date_range?.end)   params.end_date   = formatLocalDate(filters.date_range.end)

  await woStore.fetchWorkOrders(params)
}

const debouncedFetch = useDebounceFn(() => {
  meta.value.page = 1
  fetchData()
}, 300)

// ── Summary ───────────────────────────────────────────────────────────────────

const summaryDate = ref(new Date().toISOString().split('T')[0])

async function refreshSummary() {
  await woStore.fetchDailySummary({ work_date: summaryDate.value })
}

// ── Actions ───────────────────────────────────────────────────────────────────

const { confirm, handleStart } = useWorkOrderActions(() => fetchData())

const { columns } = useWorkOrderColumns(
  {
    onView:  (wo) => router.push(`/production-plan/work-order/${wo.id}`),
    onStart: (wo) => handleStart(wo),
  },
  ui,
  pagination,
)

// ── Watchers ──────────────────────────────────────────────────────────────────

watch(search, () => debouncedFetch())
watch(filters, () => { meta.value.page = 1; fetchData() }, { deep: true })
watch(summaryDate, refreshSummary)

// ── Breadcrumbs ───────────────────────────────────────────────────────────────

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Production Plan' },
  { label: 'Work Orders' },
]

onMounted(async () => {
  await Promise.all([fetchData(), refreshSummary()])
})
</script>

<template>
  <UDashboardPanel id="work-orders">
    <template #header>
      <UDashboardNavbar title="Work Orders">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-5">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">Work Orders</h1>
            <p class="text-sm text-muted mt-0.5">Manage and monitor shop floor Work Orders</p>
          </div>
        </div>

        <WODailySummary
          v-model:work-date="summaryDate"
          :summary="dailySummary"
          :loading="loading"
          @refresh="refreshSummary"
        />

        <WOFilters
          :search="search"
          :filters="filters"
          @update:search="search = $event"
          @update:filters="Object.assign(filters, $event)"
          @reset="resetFilters"
        />

        <UTable
          ref="table"
          v-model:row-selection="rowSelection"
          :data="loading ? [] : workOrders"
          :columns="columns"
          :loading="loading"
          class="w-full"
        />

        <div
          v-if="!loading && workOrders.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center text-muted gap-3"
        >
          <UIcon name="i-lucide-clipboard-x" class="w-10 h-10" />
          <div>
            <p class="text-sm font-medium">No Work Orders found</p>
            <p class="text-xs mt-1">Try adjusting your filters or search.</p>
          </div>
          <UButton label="Reset Filters" color="neutral" variant="soft" size="sm" @click="resetFilters" />
        </div>

        <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
          <p class="text-sm text-muted">
            Total {{ meta.total }} work order(s).
          </p>
          <UPagination
            v-model:page="meta.page"
            :total="meta.total"
            :items-per-page="meta.limit"
            @update:page="fetchData"
          />
        </div>

        <ConfirmDialog
          v-model:open="confirm.open"
          :title="confirm.title"
          :description="confirm.description"
          :confirm-label="confirm.confirmLabel"
          :loading="woStore.saving"
          @confirm="confirm.action?.()"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>