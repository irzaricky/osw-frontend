<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useLineCapacityStore } from '../../../stores/master-data/line-capacity.store'
import { useAppToast } from '../../../composables/useAppToast'
import type { LineCapacitySavedParams } from '../../../types/master-data/line-capacity'
 
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
 
// ── Router & Route ─────────────────────────────────────────────────────────
const route  = useRoute()
const router = useRouter()
const lineId = computed(() => Number(route.params.line_id))
 
// ── Store ──────────────────────────────────────────────────────────────────
const lineCapacityStore = useLineCapacityStore()
const { currentParams, previewResult, loading, previewing, calculating, deleting } =
  storeToRefs(lineCapacityStore)
const { toastSuccess, toastError } = useAppToast()
 
// ── Breadcrumbs ────────────────────────────────────────────────────────────
const breadcrumbItems = computed(() => [
  { label: 'Home',        to: '/' },
  { label: 'Master Data' },
  { label: 'Lines',       to: { name: 'master-data-lines' } },
  { label: currentParams.value?.line?.name ?? 'Line' },
  { label: 'Line Capacity' }
])
 
// ── Period selector ────────────────────────────────────────────────────────
const now           = new Date()
const selectedYear  = ref<number>(now.getFullYear())
const selectedMonth = ref<number>(now.getMonth() + 1)
 
const yearOptions = computed(() => {
  const years: number[] = []
  for (let y = now.getFullYear() + 1; y >= now.getFullYear() - 3; y--) {
    years.push(y)
  }
  return years
})
 
const monthOptions = [
  { label: 'January',   value: 1  },
  { label: 'February',  value: 2  },
  { label: 'March',     value: 3  },
  { label: 'April',     value: 4  },
  { label: 'May',       value: 5  },
  { label: 'June',      value: 6  },
  { label: 'July',      value: 7  },
  { label: 'August',    value: 8  },
  { label: 'September', value: 9  },
  { label: 'October',   value: 10 },
  { label: 'November',  value: 11 },
  { label: 'December',  value: 12 },
]
 
// ── Form fields untuk calculate ────────────────────────────────────────────
const efficiencyFactor = ref<number>(0.85)
/**
 * manpower sekarang wajib diisi secara eksplisit.
 * BE tidak lagi bisa men-derive ini dari employee group (tabel sudah dihapus).
 * Default-nya di-sync dari previewResult.suggested_manpower saat preview berhasil.
 */
const manpower = ref<number | null>(null)

// Sync efficiencyFactor & manpower dari preview result
watch(previewResult, (val) => {
  if (val?.existing_param?.default_efficiency_factor != null) {
    efficiencyFactor.value = val.existing_param.default_efficiency_factor
  }
  // Gunakan suggested_manpower sebagai pre-fill jika manpower belum diisi
  // atau saat periode berganti (reset ke saran dari BE)
  if (val?.suggested_manpower != null) {
    manpower.value = val.suggested_manpower
  } else if (val !== null) {
    // Preview berhasil tapi tidak ada histori manpower sama sekali → reset
    manpower.value = null
  }
})
 
// ── Computed: validasi form ────────────────────────────────────────────────
const isFormValid = computed(() =>
  efficiencyFactor.value >= 0.1 &&
  efficiencyFactor.value <= 1 &&
  manpower.value != null &&
  manpower.value >= 1 &&
  !isSelectedPeriodPast.value
)

// ── Confirm dialog untuk delete ────────────────────────────────────────────
const confirmDialog = ref({
  open:        false,
  title:       '',
  description: '',
  action:      null as (() => Promise<void>) | null
})
 
// ── Fetch data ─────────────────────────────────────────────────────────────
async function loadParams() {
  try {
    await lineCapacityStore.fetchParams(lineId.value, true)
  } catch (err) {
    toastError(err)
  }
}
 
async function loadPreview() {
  try {
    await lineCapacityStore.fetchPreview(lineId.value, selectedYear.value, selectedMonth.value)
  } catch (err) {
    toastError(err)
  }
}
 
// Reload preview saat period berubah
watch([selectedYear, selectedMonth], () => {
  loadPreview()
})
 
onMounted(() => {
  loadParams()
  loadPreview()
})
 
// ── Calculate ──────────────────────────────────────────────────────────────
async function handleCalculate() {
  if (manpower.value == null || manpower.value < 1) {
    toastError('Manpower harus diisi dan bernilai minimal 1.')
    return
  }
  try {
    const res = await lineCapacityStore.calculate(lineId.value, {
      year:              selectedYear.value,
      month:             selectedMonth.value,
      efficiency_factor: efficiencyFactor.value,
      manpower:          manpower.value,
    })
    const msg = res?.message ?? 'Capacity params calculated successfully'
    toastSuccess(msg)
    // Refresh preview untuk update already_calculated flag & suggested_manpower
    await loadPreview()
  } catch (err) {
    toastError(err)
  }
}
 
// ── Recalculate satu row dari tabel ───────────────────────────────────────
async function handleRecalculate(param: LineCapacitySavedParams) {
  selectedYear.value  = param.param_year
  selectedMonth.value = param.param_month
  // Set manpower dari param yang akan direcalculate
  manpower.value = param.default_manpower
  await handleCalculate()
}
 
// ── Delete ─────────────────────────────────────────────────────────────────
function handleDelete(param: LineCapacitySavedParams) {
  confirmDialog.value.title       = 'Delete Capacity Params'
  confirmDialog.value.description = `Are you sure you want to delete capacity params for period ${param.period}? This action cannot be undone.`
  confirmDialog.value.action      = async () => {
    try {
      const res = await lineCapacityStore.deleteParam(lineId.value, param.param_year, param.param_month)
      toastSuccess(res?.message ?? `Params for ${param.period} deleted`)
      confirmDialog.value.open = false
      await loadPreview()
    } catch (err) {
      toastError(err)
      confirmDialog.value.open = false
    }
  }
  confirmDialog.value.open = true
}
 
// ── Format helpers ─────────────────────────────────────────────────────────
function formatSeconds(seconds: number): string {
  if (!seconds && seconds !== 0) return '-'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}
 
function formatEfficiency(val: number): string {
  return `${(Number(val) * 100).toFixed(0)}%`
}
 
function formatPeriodLabel(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}
 
// ── Computed: apakah periode yang dipilih sudah past ─────────────────────
const isSelectedPeriodPast = computed(() => {
  const selected = selectedYear.value * 100 + selectedMonth.value
  const current  = now.getFullYear() * 100 + (now.getMonth() + 1)
  return selected < current
})
 
// ── Saved params fields ────────────────────────────────────────────────────
const savedParamFields: {
  key:       keyof LineCapacitySavedParams
  label:     string
  unit?:     string
  highlight?: boolean
  format?:   (v: any) => string
}[] = [
  { key: 'default_working_days',            label: 'Working Days',  unit: 'days'  },
  { key: 'default_shifts_per_day',          label: 'Shifts / Day',  unit: 'shift' },
  { key: 'default_working_hours_per_shift', label: 'Hours / Shift', unit: 'hrs'   },
  { key: 'default_manpower',                label: 'Manpower',      unit: 'pax'   },
  {
    key:       'default_efficiency_factor',
    label:     'Efficiency',
    highlight: true,
    format:    (v) => formatEfficiency(v)
  },
  { key: 'default_overtime_hours',          label: 'Overtime',      unit: 'hrs'   },
  {
    key:    'default_max_takt_time',
    label:  'Max Takt Time',
    format: (v) => formatSeconds(Number(v))
  },
]
 
function formatFieldValue(field: (typeof savedParamFields)[number], value: any): string {
  if (value == null) return '-'
  if (field.format) return field.format(value)
  return String(value)
}
</script>
 
<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />
 
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <div class="flex items-center gap-4">
      <UButton
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        @click="router.push({ name: 'master-data-lines' })"
      />
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Line Capacity
        </h1>
        <p v-if="currentParams?.line" class="text-sm text-muted mt-1">
          {{ currentParams.line.line_code }} — {{ currentParams.line.name }}
        </p>
      </div>
    </div>
 
    <!-- ── Period Selector + Calculate ────────────────────────────────── -->
    <div class="bg-default border border-default rounded-lg p-5 space-y-4">
      <p class="text-xs font-semibold text-muted uppercase tracking-widest">
        Calculate Capacity for Period
      </p>
 
      <div class="flex flex-wrap items-end gap-4">
        <!-- Year -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-muted">Year</label>
          <USelectMenu
            v-model="selectedYear"
            :items="yearOptions"
            class="w-28"
          />
        </div>
 
        <!-- Month -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-muted">Month</label>
          <USelectMenu
            v-model="selectedMonth"
            :items="monthOptions"
            value-key="value"
            label-key="label"
            class="w-36"
          />
        </div>
 
        <!-- Efficiency Factor -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-muted">Efficiency Factor</label>
          <div class="flex items-center gap-2">
            <UInput
              v-model.number="efficiencyFactor"
              type="number"
              min="0.1"
              max="1"
              step="0.01"
              class="w-28 font-mono"
            />
            <span class="text-sm text-muted">
              ({{ (efficiencyFactor * 100).toFixed(0) }}%)
            </span>
          </div>
        </div>

        <!-- Manpower -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-muted">
            Manpower
            <span class="text-error ml-0.5">*</span>
          </label>
          <div class="flex items-center gap-2">
            <UInput
              v-model.number="manpower"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 10"
              class="w-28 font-mono"
              :class="{ 'ring-1 ring-error': manpower == null || manpower < 1 }"
            />
            <span class="text-sm text-muted">pax</span>
          </div>
          <p
            v-if="previewResult?.suggested_manpower != null"
            class="text-[11px] text-muted"
          >
            Suggested: {{ previewResult.suggested_manpower }} pax
          </p>
          <p
            v-else-if="previewResult !== null"
            class="text-[11px] text-warning"
          >
            Belum ada histori manpower. Isi manual.
          </p>
        </div>
 
        <!-- Calculate Button -->
        <UButton
          :label="previewResult?.already_calculated ? 'Recalculate' : 'Calculate'"
          :icon="previewResult?.already_calculated ? 'i-lucide-refresh-cw' : 'i-lucide-play'"
          color="primary"
          :loading="calculating"
          :disabled="!isFormValid"
          @click="handleCalculate"
        />
      </div>
 
      <!-- Info: past period -->
      <p v-if="isSelectedPeriodPast" class="text-xs text-warning flex items-center gap-1">
        <UIcon name="i-lucide-info" class="w-3.5 h-3.5" />
        Period {{ formatPeriodLabel(selectedYear, selectedMonth) }} sudah lewat dan tidak dapat dikalkulasi.
      </p>
 
      <!-- Preview: already calculated badge -->
      <div v-if="previewResult && !isSelectedPeriodPast" class="flex items-center gap-2">
        <UBadge
          v-if="previewResult.already_calculated"
          color="success"
          variant="soft"
          icon="i-lucide-check-circle"
          :label="`Already calculated · ${previewResult.existing_param?.calculated_at ? new Date(previewResult.existing_param.calculated_at).toLocaleDateString() : ''}`"
        />
        <UBadge
          v-else
          color="neutral"
          variant="soft"
          icon="i-lucide-clock"
          label="Not yet calculated for this period"
        />
      </div>
 
      <!-- Preview: calendar params untuk periode yang dipilih -->
      <div v-if="previewResult?.calendar_params && !previewing" class="pt-2 border-t border-default">
        <p class="text-xs font-semibold text-muted uppercase tracking-widest mb-2">
          Shift Calendar Preview ({{ formatPeriodLabel(selectedYear, selectedMonth) }})
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div class="bg-elevated rounded-md px-3 py-2 border border-default">
            <p class="text-[11px] text-muted mb-0.5">Working Days</p>
            <p class="text-sm font-semibold font-mono text-highlighted">
              {{ previewResult.calendar_params.working_days }}
              <span class="text-[11px] font-normal text-muted">days</span>
            </p>
          </div>
          <div class="bg-elevated rounded-md px-3 py-2 border border-default">
            <p class="text-[11px] text-muted mb-0.5">Shifts / Day</p>
            <p class="text-sm font-semibold font-mono text-highlighted">
              {{ previewResult.calendar_params.shifts_per_day }}
            </p>
          </div>
          <div class="bg-elevated rounded-md px-3 py-2 border border-default">
            <p class="text-[11px] text-muted mb-0.5">Hours / Shift</p>
            <p class="text-sm font-semibold font-mono text-highlighted">
              {{ previewResult.calendar_params.working_hours_per_shift }}
              <span class="text-[11px] font-normal text-muted">hrs</span>
            </p>
          </div>
          <div class="bg-elevated rounded-md px-3 py-2 border border-default">
            <p class="text-[11px] text-muted mb-0.5">Overtime</p>
            <p class="text-sm font-semibold font-mono text-highlighted">
              {{ previewResult.calendar_params.overtime_hours }}
              <span class="text-[11px] font-normal text-muted">
                hrs / {{ previewResult.calendar_params.total_overtime_days }} days
              </span>
            </p>
          </div>
        </div>
        <p class="text-[11px] text-muted mt-2">
          Period: {{ previewResult.calendar_params.date_range?.start }} –
          {{ previewResult.calendar_params.date_range?.end }}
        </p>
      </div>
 
      <!-- Preview: shift calendar belum dikonfigurasi -->
      <div
        v-else-if="previewResult && !previewResult.calendar_params && !previewing"
        class="flex items-center gap-2 text-warning text-xs pt-2 border-t border-default"
      >
        <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 shrink-0" />
        Shift calendar belum dikonfigurasi untuk periode ini. Konfigurasi shift calendar terlebih dahulu.
      </div>
 
      <div v-if="previewing" class="flex items-center gap-2 text-muted text-xs">
        <UIcon name="i-lucide-loader-circle" class="w-4 h-4 animate-spin" />
        Loading preview...
      </div>
    </div>
 
    <!-- ── Actual Line Condition ────────────────────────────────────────── -->
    <div v-if="currentParams?.actual" class="space-y-3">
      <p class="text-xs font-semibold text-muted uppercase tracking-widest">
        Actual Line Condition
      </p>
 
      <!-- Hanya 3 metric — default_manpower & total_all_members dihapus
           karena tidak lagi dikembalikan BE (SEmployeeGroup sudah dihapus) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div class="bg-default rounded-md px-3 py-2 border border-default">
          <p class="text-[11px] text-muted mb-0.5">Active Stations</p>
          <p class="text-sm font-semibold font-mono text-highlighted">
            {{ currentParams.actual.total_active_stations ?? '-' }}
          </p>
        </div>
        <div class="bg-default rounded-md px-3 py-2 border border-default">
          <p class="text-[11px] text-muted mb-0.5">Active Jobs</p>
          <p class="text-sm font-semibold font-mono text-highlighted">
            {{ currentParams.actual.total_active_jobs ?? '-' }}
          </p>
        </div>
        <div class="bg-default rounded-md px-3 py-2 border border-default">
          <p class="text-[11px] text-muted mb-0.5">Max Takt Time</p>
          <p class="text-sm font-semibold font-mono text-highlighted">
            {{ formatSeconds(currentParams.actual.max_takt_time_seconds) }}
          </p>
        </div>
      </div>
 
      <!-- Bottleneck -->
      <div
        v-if="currentParams.actual.bottleneck_station"
        class="flex items-start gap-2 bg-warning/10 border border-warning/30 rounded-md px-3 py-2 w-fit max-w-full"
      >
        <UIcon name="i-lucide-alert-triangle" class="text-warning mt-0.5 shrink-0 w-4 h-4" />
        <div class="min-w-0">
          <p class="text-[11px] text-muted mb-0.5">Bottleneck Station</p>
          <p class="text-sm font-semibold text-highlighted truncate">
            {{ currentParams.actual.bottleneck_station.station_code }} —
            {{ currentParams.actual.bottleneck_station.name }}
            <span class="text-muted font-normal ml-1 whitespace-nowrap">
              ({{ formatSeconds(currentParams.actual.bottleneck_station.takt_time_seconds) }},
              {{ currentParams.actual.bottleneck_station.total_jobs }} jobs)
            </span>
          </p>
        </div>
      </div>
 
      <!-- Stations table -->
      <div v-if="currentParams.actual.stations?.length">
        <p class="text-[11px] font-semibold text-muted uppercase tracking-widest mb-1.5">Stations</p>
        <div class="rounded-md border border-default overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-elevated border-b border-default">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-muted w-12">Seq</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-muted w-28">Code</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-muted">Name</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-muted w-16">Jobs</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-muted w-24">Takt Time</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="station in currentParams.actual.stations"
                :key="station.station_id"
                class="border-t border-default hover:bg-elevated/60 transition-colors"
                :class="{ 'bg-warning/5': currentParams.actual.bottleneck_station?.station_id === station.station_id }"
              >
                <td class="px-3 py-2 text-muted">{{ station.sequence }}</td>
                <td class="px-3 py-2 font-medium font-mono">{{ station.station_code }}</td>
                <td class="px-3 py-2 text-muted truncate max-w-[200px]">{{ station.name }}</td>
                <td class="px-3 py-2 text-right text-muted">{{ station.total_jobs }}</td>
                <td class="px-3 py-2 text-right">
                  <span
                    class="font-medium font-mono"
                    :class="currentParams.actual.bottleneck_station?.station_id === station.station_id
                      ? 'text-warning' : 'text-highlighted'"
                  >
                    {{ formatSeconds(station.takt_time_seconds) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Employee Groups dihapus — tabel SEmployeeGroup sudah tidak ada di schema BE -->
    </div>
 
    <!-- ── Capacity History Table ───────────────────────────────────────── -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-xs font-semibold text-muted uppercase tracking-widest">
          Capacity History
          <span v-if="currentParams?.total_params != null" class="ml-1 normal-case font-normal text-muted">
            ({{ currentParams.total_params }} records)
          </span>
        </p>
      </div>
 
      <div v-if="loading" class="flex items-center justify-center py-12 text-muted">
        <UIcon name="i-lucide-loader-circle" class="w-5 h-5 animate-spin mr-2" />
        Loading...
      </div>
 
      <div
        v-else-if="!currentParams?.params?.length"
        class="text-center py-12 text-sm text-muted border border-default border-dashed rounded-lg"
      >
        No capacity data yet. Select a period and click Calculate.
      </div>
 
      <div v-else class="rounded-md border border-default overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-elevated border-b border-default">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-muted">Period</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-muted">Working Days</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-muted">Shifts/Day</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-muted">Hrs/Shift</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-muted">Manpower</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-muted">Efficiency</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-muted">Overtime</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-muted">Max Takt</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-muted">Calculated At</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-muted w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="param in currentParams.params"
              :key="param.id"
              class="border-t border-default hover:bg-elevated/60 transition-colors"
              :class="{
                'bg-primary/5 border-primary/20':
                  param.param_year === selectedYear && param.param_month === selectedMonth
              }"
            >
              <td class="px-4 py-3">
                <span class="font-mono font-semibold text-highlighted">{{ param.period }}</span>
                <UBadge
                  v-if="param.param_year === now.getFullYear() && param.param_month === (now.getMonth() + 1)"
                  color="primary"
                  variant="soft"
                  label="Current"
                  class="ml-2 text-[10px]"
                />
              </td>
              <td class="px-4 py-3 text-right font-mono">{{ param.default_working_days }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ param.default_shifts_per_day }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ param.default_working_hours_per_shift }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ param.default_manpower }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ formatEfficiency(param.default_efficiency_factor) }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ param.default_overtime_hours }}h</td>
              <td class="px-4 py-3 text-right font-mono">{{ formatSeconds(param.default_max_takt_time) }}</td>
              <td class="px-4 py-3 text-right text-muted text-xs">
                {{ param.calculated_at ? new Date(param.calculated_at).toLocaleDateString() : '-' }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <!-- Recalculate button (hanya untuk bulan berjalan ke atas) -->
                  <UButton
                    v-if="(param.param_year * 100 + param.param_month) >= (now.getFullYear() * 100 + (now.getMonth() + 1))"
                    icon="i-lucide-refresh-cw"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    :loading="calculating && selectedYear === param.param_year && selectedMonth === param.param_month"
                    title="Recalculate"
                    @click="handleRecalculate(param)"
                  />
                  <!-- Delete button (hanya untuk bulan yang sudah lewat) -->
                  <UButton
                    v-if="(param.param_year * 100 + param.param_month) < (now.getFullYear() * 100 + (now.getMonth() + 1))"
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    :loading="deleting"
                    title="Delete"
                    @click="handleDelete(param)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
 
    <!-- ── Confirm Dialog ──────────────────────────────────────────────── -->
    <ConfirmDialog
      v-model:open="confirmDialog.open"
      :title="confirmDialog.title"
      :description="confirmDialog.description"
      confirm-label="Delete"
      :loading="deleting"
      @confirm="confirmDialog.action?.()"
    />
  </div>
</template>