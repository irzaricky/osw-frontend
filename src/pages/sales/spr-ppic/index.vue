<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSprStore } from '../../../stores/sales/spr.store'
import { storeToRefs } from 'pinia'
import { useAppToast } from '../../../composables/useAppToast'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'

const store = useSprStore()
const { loading, ppicAggregation } = storeToRefs(store)
const { toastSuccess, toastError } = useAppToast()

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Sales' },
  { label: 'SPR PPIC Review' }
]

// ─── Month filter — default to current month ──────────────────────────────────
const today = new Date()
const currentMonth = ref(today.getMonth() + 1)
const currentYear = ref(today.getFullYear())

const selectedMonth = computed(() => {
  return `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}`
})

// ─── Fetch data ───────────────────────────────────────────────────────────────
async function fetchData() {
  try {
    await store.fetchPpicAggregation({ month: selectedMonth.value })
  } catch (e: any) {
    toastError(e)
  }
}

watch(selectedMonth, fetchData)
onMounted(fetchData)

// ─── Pivot table shortcuts ─────────────────────────────────────────────────────
const months   = computed(() => ppicAggregation.value?.months   ?? [])
const parts    = computed(() => ppicAggregation.value?.parts    ?? [])
const matrix   = computed(() => ppicAggregation.value?.matrix   ?? {})
const mTotals  = computed(() => ppicAggregation.value?.month_totals ?? {})
const pTotals  = computed(() => ppicAggregation.value?.part_totals  ?? {})
const gTotal   = computed(() => ppicAggregation.value?.grand_total  ?? 0)
const pendingSprs = computed(() => ppicAggregation.value?.pending_sprs ?? [])
const pendingCount = computed(() => ppicAggregation.value?.pending_spr_count ?? 0)

function cellData(partId: number, month: string) {
  return matrix.value[String(partId)]?.[month] ?? null
}

function fmt(n: number | undefined | null) {
  if (!n) return '-'
  return n.toLocaleString('id-ID')
}

function fmtMonth(m: string) {
  const [y, mo] = m.split('-')
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleString('default', {
    month: 'long', year: 'numeric'
  })
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Cell Tooltip / Detail popover ───────────────────────────────────────────
const cellDetail = ref<{ partName: string; month: string; data: any } | null>(null)

function openCellDetail(part: any, month: string) {
  const data = cellData(part.part_id, month)
  if (!data) return
  cellDetail.value = {
    partName: `${part.part_number} — ${part.part_name}`,
    month: fmtMonth(month),
    data
  }
}

// ─── Batch Approve ────────────────────────────────────────────────────────────
const confirmApprove = ref({ open: false })
const approveRemarks = ref('')

function openApproveConfirm() {
  approveRemarks.value = ''
  confirmApprove.value.open = true
}

async function executeBatchApprove() {
  try {
    const res = await store.batchApprovePpic({
      month: selectedMonth.value,
      remarks: approveRemarks.value || undefined
    })
    toastSuccess(res.message || `${res.data?.approved_count} SPR(s) approved`)
    confirmApprove.value.open = false
    approveRemarks.value = ''
    fetchData()
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Cell intensity for heatmap colouring ─────────────────────────────────────
function cellIntensity(partId: number, month: string): string {
  const cell = cellData(partId, month)
  if (!cell) return ''
  const colTotal = mTotals.value[month] || 1
  const pct = cell.total_qty / colTotal
  if (pct >= 0.4) return 'bg-primary/30 dark:bg-primary/25 font-semibold'
  if (pct >= 0.2) return 'bg-primary/15 dark:bg-primary/15'
  return 'bg-primary/5 dark:bg-primary/8'
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">

    <!-- Header -->
    <div class="px-6 pt-6 pb-4 border-b border-default space-y-3 shrink-0">
      <Breadcrumbs :items="breadcrumbItems" />
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold">SPR PPIC Review</h1>
          <p class="text-sm text-muted mt-0.5">Jumlah kebutuhan material per varian produk</p>
        </div>

        <!-- <div class="flex items-center gap-1 shrink-0">
          <UButton
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="prevMonth"
          />
          <div class="flex items-center gap-1">
            <USelect
              v-model="currentMonth"
              :items="monthOptions"
              value-key="value"
              label-key="label"
              size="sm"
              class="w-32"
            />
            <USelect
              v-model="currentYear"
              :items="years"
              value-key="value"
              label-key="label"
              size="sm"
              class="w-24"
            />
          </div>
          <UButton
            icon="i-lucide-chevron-right"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="nextMonth"
          />
          
          <div class="w-px h-6 bg-default mx-1" />
        </div> -->
      </div>
    </div>

    <!-- Body: scrollable -->
    <div class="flex-1 overflow-y-auto p-6 space-y-6">

      <!-- Loading skeleton -->
      <div v-if="loading && !ppicAggregation" class="flex justify-center py-20">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
      </div>

      <template v-else>

        <!-- ── Summary Cards ──────────────────────────────────────────────── -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-elevated/60 rounded-2xl border border-default p-4 space-y-1">
            <div class="text-xs text-muted uppercase tracking-wide">Pending SPR</div>
            <div class="text-3xl font-bold text-warning-500">{{ pendingCount }}</div>
            <div class="text-xs text-muted">menunggu persetujuan PPIC</div>
          </div>
          <div class="bg-elevated/60 rounded-2xl border border-default p-4 space-y-1">
            <div class="text-xs text-muted uppercase tracking-wide">Varian Produk</div>
            <div class="text-3xl font-bold text-primary">{{ parts.length }}</div>
            <div class="text-xs text-muted">part unik dalam periode ini</div>
          </div>
          <div class="bg-elevated/60 rounded-2xl border border-default p-4 space-y-1">
            <div class="text-xs text-muted uppercase tracking-wide">Total Qty</div>
            <div class="text-3xl font-bold text-success-500">{{ gTotal.toLocaleString('id-ID') }}</div>
            <div class="text-xs text-muted">unit dari semua SPR pending</div>
          </div>
          <div class="bg-elevated/60 rounded-2xl border border-default p-4 space-y-1">
            <div class="text-xs text-muted uppercase tracking-wide">Bulan Target</div>
            <div class="text-xl font-bold">{{ fmtMonth(selectedMonth) }}</div>
            <div class="text-xs text-muted">filter periode aktif</div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="pendingCount === 0" class="flex flex-col items-center justify-center py-20 gap-4 text-muted">
          <UIcon name="i-lucide-inbox" class="w-14 h-14 opacity-30" />
          <p class="text-sm">Tidak ada SPR dengan status <strong>Waiting Review PPIC</strong> untuk bulan <strong>{{ fmtMonth(selectedMonth) }}</strong></p>
        </div>

        <template v-else>

          <!-- ── Pivot Table ─────────────────────────────────────────────── -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold">Ringkasan Agregasi per Varian Produk</h2>
              <div class="flex items-center gap-2 text-xs text-muted">
                <span class="inline-flex items-center gap-1">
                  <span class="w-3 h-3 rounded bg-primary/30 inline-block"></span> ≥ 40% kolom
                </span>
                <span class="inline-flex items-center gap-1">
                  <span class="w-3 h-3 rounded bg-primary/15 inline-block"></span> 20–40%
                </span>
                <span class="inline-flex items-center gap-1">
                  <span class="w-3 h-3 rounded bg-primary/5 inline-block"></span> &lt; 20%
                </span>
              </div>
            </div>

            <div class="overflow-x-auto border border-default rounded-xl">
              <table class="w-full text-left border-collapse text-sm">
                <thead class="bg-elevated/60 border-b border-default">
                  <tr>
                    <th class="p-3 font-semibold border-r border-default min-w-[220px] sticky left-0 bg-elevated/90 backdrop-blur z-10">
                      Varian Produk
                    </th>
                    <th
                      v-for="m in months"
                      :key="m"
                      class="p-3 font-semibold border-r border-default min-w-[130px] text-center"
                    >
                      {{ fmtMonth(m) }}
                    </th>
                    <th class="p-3 font-semibold text-center min-w-[110px] bg-elevated/80">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="part in parts"
                    :key="part.part_id"
                    class="border-b border-default last:border-b-0 hover:bg-elevated/20 transition-colors"
                  >
                    <!-- Part label (sticky left) -->
                    <td class="p-3 border-r border-default sticky left-0 bg-default z-10">
                      <div class="font-mono text-xs font-semibold text-primary">{{ part.part_number }}</div>
                      <div class="text-xs text-muted line-clamp-1 mt-0.5">{{ part.part_name }}</div>
                    </td>

                    <!-- Data cells -->
                    <td
                      v-for="m in months"
                      :key="m"
                      class="p-3 border-r border-default text-center transition-colors cursor-pointer"
                      :class="cellData(part.part_id, m) ? cellIntensity(part.part_id, m) : 'text-muted'"
                      @click="openCellDetail(part, m)"
                    >
                      <template v-if="cellData(part.part_id, m)">
                        <div class="font-mono font-semibold">{{ fmt(cellData(part.part_id, m)!.total_qty) }}</div>
                        <div class="text-xs text-muted mt-0.5">{{ cellData(part.part_id, m)!.spr_count }} SPR</div>
                      </template>
                      <span v-else class="text-xs opacity-40">—</span>
                    </td>

                    <!-- Row total -->
                    <td class="p-3 text-center font-bold font-mono bg-elevated/30">
                      {{ fmt(pTotals[String(part.part_id)]) }}
                    </td>
                  </tr>
                </tbody>
                <!-- Footer totals row -->
                <tfoot class="border-t-2 border-default bg-elevated/50">
                  <tr>
                    <td class="p-3 font-bold text-sm sticky left-0 bg-elevated/80 backdrop-blur z-10">
                      TOTAL
                    </td>
                    <td
                      v-for="m in months"
                      :key="m"
                      class="p-3 text-center font-bold font-mono text-primary"
                    >
                      {{ fmt(mTotals[m]) }}
                    </td>
                    <td class="p-3 text-center font-bold font-mono text-success-600 dark:text-success-400 text-base">
                      {{ gTotal.toLocaleString('id-ID') }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- ── Batch Approve Section ───────────────────────────────────── -->
          <div class="flex items-center justify-between p-4 rounded-2xl border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20">
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-clipboard-check" class="w-5 h-5 text-warning-600 dark:text-warning-400 shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-semibold text-warning-800 dark:text-warning-300">
                  Setujui Semua SPR — {{ fmtMonth(selectedMonth) }}
                </p>
                <p class="text-xs text-warning-700 dark:text-warning-400 mt-0.5">
                  Terdapat <strong>{{ pendingCount }} SPR</strong> yang menunggu persetujuan Anda. Batch Approve akan menyetujui semua sekaligus.
                </p>
              </div>
            </div>
            <UButton
              label="Batch Approve"
              icon="i-lucide-check-circle-2"
              color="warning"
              variant="solid"
              size="sm"
              :disabled="pendingCount === 0"
              @click="openApproveConfirm"
            />
          </div>

          <!-- ── Pending SPR Cards ───────────────────────────────────────── -->
          <div class="space-y-2">
            <h2 class="text-base font-semibold">
              Daftar SPR Pending
              <UBadge color="warning" variant="subtle" size="sm" class="ml-2">{{ pendingCount }}</UBadge>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              <div
                v-for="spr in pendingSprs"
                :key="spr.id"
                class="bg-elevated/50 rounded-xl border border-default p-4 space-y-3 hover:border-warning-400 dark:hover:border-warning-600 transition-colors"
              >
                <!-- Header -->
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-xs font-mono font-semibold text-primary">{{ spr.spr_number }}</p>
                    <p class="text-sm font-medium mt-0.5 truncate">{{ spr.spr_name }}</p>
                  </div>
                  <UBadge
                    :color="spr.source === 'Automatic' ? 'info' : 'neutral'"
                    variant="subtle"
                    size="xs"
                    class="shrink-0"
                  >
                    {{ spr.source }}
                  </UBadge>
                </div>

                <!-- Meta -->
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div class="text-muted">Required Date</div>
                    <div class="font-medium text-warning-600 dark:text-warning-400">{{ formatDate(spr.required_date) }}</div>
                  </div>
                  <div>
                    <div class="text-muted">Total Qty</div>
                    <div class="font-bold font-mono text-success-600 dark:text-success-400">{{ spr.total_qty.toLocaleString('id-ID') }}</div>
                  </div>
                  <div>
                    <div class="text-muted">Varian</div>
                    <div class="font-medium">{{ spr.part_count }} part</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </template>
      </template>
    </div>

    <!-- ── Cell Detail Modal ──────────────────────────────────────────────────── -->
    <UModal
      v-model:open="cellDetail"
      :title="cellDetail?.partName"
      :description="`Daftar SPR yang berkontribusi — ${cellDetail?.month}`"
      class="sm:max-w-lg"
    >
      <template #body>
        <div class="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          <div
            v-for="spr in cellDetail?.data?.sprs"
            :key="spr.id"
            class="flex items-center justify-between p-3 rounded-lg border border-default bg-elevated/40 hover:bg-elevated/70 transition-colors"
          >
            <div>
              <p class="text-xs font-mono font-semibold text-primary">{{ spr.spr_number }}</p>
              <p class="text-sm mt-0.5">{{ spr.spr_name }}</p>
              <p class="text-xs text-muted mt-0.5">
                <UIcon name="i-lucide-calendar" class="w-3 h-3 inline" />
                {{ formatDate(spr.required_date) }}
              </p>
            </div>
            <div class="text-right shrink-0">
              <div class="text-lg font-bold font-mono text-success-600 dark:text-success-400">
                {{ spr.qty.toLocaleString('id-ID') }}
              </div>
              <div class="text-xs text-muted">unit</div>
            </div>
          </div>

          <!-- Total -->
          <div class="flex justify-between p-3 rounded-lg border-2 border-primary/30 bg-primary/5">
            <span class="text-sm font-semibold">Total</span>
            <span class="font-bold font-mono text-primary text-base">
              {{ cellDetail?.data?.total_qty?.toLocaleString('id-ID') }}
            </span>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end w-full">
          <UButton color="neutral" variant="ghost" label="Tutup" @click="cellDetail = null" />
        </div>
      </template>
    </UModal>

    <!-- ── Batch Approve Confirm Dialog ───────────────────────────────────────── -->
    <UModal
      v-model:open="confirmApprove.open"
      title="Batch Approve SPR"
      :description="`Semua ${pendingCount} SPR dengan status 'Waiting Review PPIC' untuk bulan ${fmtMonth(selectedMonth)} akan disetujui.`"
    >
      <template #body>
        <div class="space-y-4">
          <div class="flex items-start gap-3 p-3 rounded-lg border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20">
            <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 text-warning-600 shrink-0 mt-0.5" />
            <p class="text-sm text-warning-800 dark:text-warning-300">
              Tindakan ini tidak dapat dibatalkan. Pastikan seluruh data agregasi sudah sesuai sebelum menyetujui.
            </p>
          </div>

          <UFormField label="Catatan (opsional)">
            <UTextarea
              v-model="approveRemarks"
              placeholder="Catatan persetujuan batch PPIC..."
              class="w-full"
              :rows="2"
            />
          </UFormField>

          <!-- SPR list summary -->
          <div class="text-xs text-muted border border-default rounded-lg p-3 max-h-32 overflow-y-auto space-y-1">
            <div v-for="spr in pendingSprs" :key="spr.id" class="flex justify-between">
              <span class="font-mono">{{ spr.spr_number }}</span>
              <span class="font-medium">{{ spr.total_qty.toLocaleString('id-ID') }} unit</span>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-2 justify-end w-full">
          <UButton color="neutral" variant="ghost" label="Batal" @click="confirmApprove.open = false" />
          <UButton
            color="success"
            label="Ya, Setujui Semua"
            icon="i-lucide-check-circle-2"
            :loading="loading"
            @click="executeBatchApprove"
          />
        </div>
      </template>
    </UModal>

  </div>
</template>
