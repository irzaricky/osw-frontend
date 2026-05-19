<script setup lang="ts">
import { computed } from 'vue'
import type { AdjustmentType } from '../../../../types/production-plan/plan'

const props = defineProps<{
  currentPlan:    any
  selectedLineId: number | undefined
	lines: any
  lineParams:     any       // { saved_params, actual } dari /line-capacity/:id/params
  loadingParams:  boolean
  adjustmentForm: any
  saving:         boolean
  calculating:    boolean
  isEditable:     boolean
  planId?:        number | null
  fmtNum:         (n?: number | null) => string
  overallStatusLabel: Record<string, string>
  overallStatusColor: Record<string, string>
}>()

const emit = defineEmits<{
  'update:selectedLineId': [val: number | undefined]
  saveBase:           []
  saveAdjustment:     []
  calculate:          []
  deleteAdjustment:   [id: number]
}>()

// Lines tersedia: ambil dari capacity_params yang sudah disimpan + filter
// unique lines dari plan context. Untuk selector kita butuh list dari parent,
// tapi karena sudah dipindah ke store flow, kita tampilkan berdasarkan
// base params yang sudah ada + opsi untuk pilih line baru.
const savedBaseParams = computed(() =>
  props.currentPlan?.capacity_params?.filter((p: any) => p.param_type === 'BASE') ?? [],
)

const hasBaseForSelected = computed(() =>
  savedBaseParams.value.some((p: any) => p.line_id === props.selectedLineId),
)

// Result untuk line yang dipilih
const selectedResult = computed(() =>
  props.currentPlan?.capacity_results?.find((r: any) => r.line_id === props.selectedLineId),
)

// Adjustments untuk line yang dipilih
const selectedAdjustments = computed(() =>
  (props.currentPlan?.adjustments ?? []).filter((a: any) => a.line_id === props.selectedLineId),
)

// Base param untuk line yang dipilih
const selectedBase = computed(() =>
  savedBaseParams.value.find((p: any) => p.line_id === props.selectedLineId),
)

// Master params tersimpan di line (sebelum di-copy ke plan)
const masterParams = computed(() => props.lineParams?.saved_params ?? null)

// Adjustment type options
const adjustmentTypeOptions = [
  { value: 'WORKING_DAYS',   label: 'Working Days' },
  { value: 'SHIFTS_PER_DAY', label: 'Shifts per Day' },
  { value: 'WORKING_HOURS',  label: 'Working Hours / Shift' },
  { value: 'MANPOWER',       label: 'Manpower' },
  { value: 'EFFICIENCY',     label: 'Efficiency Factor' },
  { value: 'OVERTIME',       label: 'Overtime Hours' },
]

const adjustmentTypeLabel: Record<AdjustmentType, string> = {
  WORKING_DAYS:   'Working Days',
  SHIFTS_PER_DAY: 'Shifts per Day',
  WORKING_HOURS:  'Working Hours / Shift',
  MANPOWER:       'Manpower',
  EFFICIENCY:     'Efficiency Factor',
  OVERTIME:       'Overtime Hours',
}

// Field untuk menampilkan base value hint di form adjustment
const baseValueForSelectedType = computed(() => {
  if (!selectedBase.value || !props.adjustmentForm.adjustment_type) return null
  const map: Record<AdjustmentType, string> = {
    WORKING_DAYS:   'working_days',
    SHIFTS_PER_DAY: 'shifts_per_day',
    WORKING_HOURS:  'working_hours_per_shift',
    MANPOWER:       'manpower',
    EFFICIENCY:     'efficiency_factor',
    OVERTIME:       'overtime_hours',
  }
  const field = map[props.adjustmentForm.adjustment_type as AdjustmentType]
  return field ? Number(selectedBase.value[field]) : null
})

function fmtPercent(v?: number | string | null) {
  if (v == null) return '—'
  const n = Number(v)
  return Number.isNaN(n) ? '—' : `${(n * (n <= 1 ? 100 : 1)).toFixed(1)}%`
}
function fmtMinutes(min?: number | null) {
  if (min == null) return '—'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
function fmtSeconds(sec?: number | null) {
  if (sec == null) return '—'
  return sec >= 60 ? `${(sec / 60).toFixed(1)} min` : `${sec}s`
}
function fmtDate(d?: string | null) {
	if (!d) return '—'
	const dt = new Date(d)
	return isNaN(dt.getTime()) ? '—' : dt.toLocaleString()
}

// Warna utilization
function utilizationColor(pct?: number | null) {
  if (pct == null) return 'text-muted'
  if (pct <= 80)  return 'text-success-600'
  if (pct <= 95)  return 'text-warning-600'
  return 'text-error-600'
}
</script>

<template>
  <div class="mt-4 space-y-5">

    <!-- ── 1. Line Selector ───────────────────────────────────────────────── -->
    <div class="bg-default border border-default rounded-xl">
      <div class="px-5 py-4 border-b border-default flex items-center gap-2">
        <UIcon name="i-lucide-factory" class="w-4 h-4 text-primary" />
        <h3 class="font-semibold text-sm">Production Line</h3>
      </div>

      <div class="px-5 py-4">
        <!-- Tabs per line yang sudah punya BASE + opsi tambah -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Line yang sudah punya BASE param -->
          <button
            v-for="param in savedBaseParams"
            :key="param.line_id"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all"
            :class="
              selectedLineId === param.line_id
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-default border-default text-default hover:border-primary/50'
            "
            @click="emit('update:selectedLineId', param.line_id)"
          >
            <UIcon name="i-lucide-check-circle" class="w-3.5 h-3.5" />
            {{ param.line?.name ?? `Line #${param.line_id}` }}
          </button>

          <p v-if="savedBaseParams.length === 0" class="text-sm text-muted">
            No lines configured yet.
          </p>
        </div>

        <!-- Input untuk pilih line baru (jika editable) -->
        <div v-if="isEditable" class="mt-4 pt-4 border-t border-default">
          <p class="text-xs text-muted mb-2 font-medium">Add another line to this plan:</p>
          <div class="flex items-end gap-3">
            <UFormField label="Select Line" class="flex-1 max-w-xs">
              <!-- Line dropdown harus di-inject dari parent via store atau service -->
              <!-- Gunakan USelectMenu dengan items dari lineService.getDropdown() -->
              <USelectMenu
                :model-value="selectedLineId"
                :items="lines"
                value-key="id"
                label-key="name"
                placeholder="Choose a line..."
                class="w-full"
                :disabled="saving"
                @update:model-value="emit('update:selectedLineId', $event)"
              />
            </UFormField>
            <UButton
              label="Load Master Params"
              icon="i-lucide-download"
              color="neutral"
              variant="soft"
              size="sm"
              :loading="loadingParams"
              :disabled="!selectedLineId || loadingParams"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Tidak ada line dipilih -->
    <div
      v-if="!selectedLineId"
      class="bg-default border border-dashed border-default rounded-xl px-5 py-10 text-center"
    >
      <UIcon name="i-lucide-mouse-pointer-click" class="w-8 h-8 text-muted mx-auto mb-2" />
      <p class="text-sm text-muted">Select a production line above to view capacity settings.</p>
    </div>

    <template v-else>

      <!-- ── 2. Master Preview + Save BASE ───────────────────────────────── -->
      <div class="bg-default border border-default rounded-xl">
        <div class="px-5 py-4 border-b border-default flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-database" class="w-4 h-4 text-primary" />
            <div>
              <h3 class="font-semibold text-sm">Base Parameters</h3>
              <p class="text-xs text-muted mt-0.5">
                {{ hasBaseForSelected
                  ? 'Snapshot copied from line master when plan was configured.'
                  : 'Values from line master — will be copied as BASE when you save.' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UBadge
              :label="hasBaseForSelected ? 'BASE Saved' : 'Not Saved'"
              :color="hasBaseForSelected ? 'success' : 'neutral'"
              variant="soft"
              size="sm"
            />
            <UButton
              v-if="isEditable && !hasBaseForSelected"
              label="Save BASE from Master"
              icon="i-lucide-save"
              color="primary"
              size="sm"
              :loading="saving"
              :disabled="!selectedLineId || loadingParams"
              @click="emit('saveBase')"
            />
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loadingParams" class="px-5 py-8 text-center">
          <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-muted mx-auto" />
          <p class="text-xs text-muted mt-2">Loading line params...</p>
        </div>

        <!-- No master params warning -->
        <div
          v-else-if="!masterParams && !hasBaseForSelected"
          class="px-5 py-6 flex items-start gap-3"
        >
          <UIcon name="i-lucide-alert-circle" class="w-4 h-4 text-warning-500 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-warning-700 dark:text-warning-400">Line capacity params not set up</p>
            <p class="text-xs text-muted mt-1">
              Go to <strong>Master Data → Lines</strong>, select this line, and run
              <strong>Calculate Capacity Params</strong> first.
            </p>
          </div>
        </div>

        <!-- Params grid -->
        <div v-else class="px-5 py-4">
          <!-- Source: dari savedBase jika sudah ada, fallback ke masterParams preview -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <div
              v-for="item in [
                { label: 'Working Days',        value: (hasBaseForSelected ? selectedBase?.working_days : masterParams?.default_working_days) ?? '—', unit: 'days' },
                { label: 'Shifts / Day',        value: (hasBaseForSelected ? selectedBase?.shifts_per_day : masterParams?.default_shifts_per_day) ?? '—', unit: 'shift' },
                { label: 'Hours / Shift',       value: (hasBaseForSelected ? selectedBase?.working_hours_per_shift : masterParams?.default_working_hours_per_shift) ?? '—', unit: 'hrs' },
                { label: 'Manpower',            value: (hasBaseForSelected ? selectedBase?.manpower : masterParams?.default_manpower) ?? '—', unit: 'pax' },
                { label: 'Efficiency',          value: (hasBaseForSelected ? selectedBase?.efficiency_factor : masterParams?.default_efficiency_factor) ?? null, unit: '%', isEfficiency: true },
                { label: 'Overtime',            value: (hasBaseForSelected ? selectedBase?.overtime_hours : masterParams?.default_overtime_hours) ?? '—', unit: 'hrs' },
                { label: 'Max Takt Time',       value: (hasBaseForSelected ? selectedBase?.max_takt_time : masterParams?.default_max_takt_time) ?? null, unit: '', isTakt: true },
              ]"
              :key="item.label"
              class="bg-elevated rounded-lg px-3 py-3 space-y-1"
            >
              <p class="text-xs text-muted leading-none">{{ item.label }}</p>
              <p class="text-sm font-semibold font-mono leading-none">
                <template v-if="item.isEfficiency">
                  {{ item.value != null ? `${(Number(item.value) * 100).toFixed(0)}%` : '—' }}
                </template>
                <template v-else-if="item.isTakt">
                  {{ fmtSeconds(item.value as number | null) }}
                </template>
                <template v-else>
                  {{ item.value }}
                  <span v-if="item.value !== '—'" class="text-xs font-normal text-muted ml-0.5">{{ item.unit }}</span>
                </template>
              </p>
            </div>
          </div>

          <!-- Actual line info (stations, jobs, manpower dari group) — hanya jika belum save BASE -->
          <div v-if="!hasBaseForSelected && lineParams?.actual" class="mt-4 pt-4 border-t border-default">
            <p class="text-xs font-medium text-muted mb-2">Actual line condition (basis of master params):</p>
            <div class="flex flex-wrap gap-3">
              <span class="inline-flex items-center gap-1.5 text-xs bg-elevated px-2.5 py-1.5 rounded-md">
                <UIcon name="i-lucide-layout-grid" class="w-3.5 h-3.5 text-muted" />
                <strong>{{ lineParams.actual.total_active_stations }}</strong> active stations
              </span>
              <span class="inline-flex items-center gap-1.5 text-xs bg-elevated px-2.5 py-1.5 rounded-md">
                <UIcon name="i-lucide-wrench" class="w-3.5 h-3.5 text-muted" />
                <strong>{{ lineParams.actual.total_active_jobs }}</strong> active jobs
              </span>
              <span class="inline-flex items-center gap-1.5 text-xs bg-elevated px-2.5 py-1.5 rounded-md">
                <UIcon name="i-lucide-users" class="w-3.5 h-3.5 text-muted" />
                <strong>{{ lineParams.actual.default_manpower }}</strong> operators
              </span>
              <span class="inline-flex items-center gap-1.5 text-xs bg-elevated px-2.5 py-1.5 rounded-md">
                <UIcon name="i-lucide-timer" class="w-3.5 h-3.5 text-muted" />
                Bottleneck: <strong class="ml-1">{{ fmtSeconds(lineParams.actual.max_takt_time_seconds) }}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 3. Add Adjustment ───────────────────────────────────────────── -->
      <div
        v-if="isEditable && hasBaseForSelected"
        class="bg-default border border-default rounded-xl"
      >
        <div class="px-5 py-4 border-b border-default flex items-center gap-2">
          <UIcon name="i-lucide-sliders-horizontal" class="w-4 h-4 text-primary" />
          <div>
            <h3 class="font-semibold text-sm">Add Adjustment</h3>
            <p class="text-xs text-muted mt-0.5">
              Override a specific parameter without changing the BASE snapshot.
            </p>
          </div>
        </div>

        <div class="px-5 py-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <UFormField label="Parameter to Adjust" required>
              <USelectMenu
                v-model="adjustmentForm.adjustment_type"
                :items="adjustmentTypeOptions"
                value-key="value"
                label-key="label"
                placeholder="Select parameter..."
                class="w-full"
                :disabled="saving"
              />
            </UFormField>

            <UFormField
              :label="`New Value${baseValueForSelectedType != null ? ` (BASE: ${baseValueForSelectedType})` : ''}`"
              required
            >
              <UInput
                v-model.number="adjustmentForm.adjusted_value"
                type="number"
                step="any"
                class="w-full font-mono"
                :disabled="saving || !adjustmentForm.adjustment_type"
              />
            </UFormField>

            <UFormField label="Reason / Description">
              <UInput
                v-model="adjustmentForm.adjustment_description"
                placeholder="e.g. National holiday deduction"
                class="w-full"
                :disabled="saving"
              />
            </UFormField>

            <div class="pb-0.5">
              <UButton
                label="Add Adjustment"
                icon="i-lucide-plus"
                color="primary"
                class="w-full"
                :loading="saving"
                :disabled="!adjustmentForm.adjustment_type"
                @click="emit('saveAdjustment')"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ── 4. Adjustment List ─────────────────────────────────────────── -->
      <div
        v-if="selectedAdjustments.length > 0"
        class="bg-default border border-default rounded-xl"
      >
        <div class="px-5 py-4 border-b border-default flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-git-branch" class="w-4 h-4 text-primary" />
            <h3 class="font-semibold text-sm">Active Adjustments</h3>
          </div>
          <UBadge
            :label="`${selectedAdjustments.length} adjustment${selectedAdjustments.length > 1 ? 's' : ''}`"
            color="warning"
            variant="soft"
            size="sm"
          />
        </div>

        <div class="divide-y divide-default">
          <div
            v-for="(adj, idx) in selectedAdjustments"
            :key="adj.id"
            class="flex items-center gap-4 px-5 py-3 hover:bg-elevated/50 transition-colors"
          >
            <div class="w-6 h-6 rounded-full bg-elevated flex items-center justify-center flex-shrink-0">
							<!-- No Urut -->
              <span class="text-xs font-mono font-semibold text-muted">{{ idx + 1 }}</span>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-medium">
                  {{ adjustmentTypeLabel[adj.adjustment_type as AdjustmentType] ?? adj.adjustment_type }}
                </span>
                <span class="text-xs text-muted font-mono">
                  {{ adj.base_value }} → {{ adj.adjusted_value }}
                </span>
                <span
                  class="text-xs font-mono font-semibold"
                  :class="Number(adj.difference) >= 0 ? 'text-success-600' : 'text-error-600'"
                >
                  {{ Number(adj.difference) >= 0 ? '+' : '' }}{{ adj.difference }}
                </span>
              </div>
              <p v-if="adj.adjustment_description" class="text-xs text-muted mt-0.5 truncate">
                {{ adj.adjustment_description }}
              </p>
            </div>

            <UButton
              v-if="isEditable"
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="xs"
              @click="emit('deleteAdjustment', adj.id)"
            />
          </div>
        </div>
      </div>

      <!-- ── 5. Calculate Button + Result ───────────────────────────────── -->
      <div class="bg-default border border-default rounded-xl">
        <div class="px-5 py-4 border-b border-default flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-calculator" class="w-4 h-4 text-primary" />
            <div>
              <h3 class="font-semibold text-sm">Capacity Calculation</h3>
              <p class="text-xs text-muted mt-0.5">
                {{ selectedResult
                  ? `Last calculated ${fmtDate(selectedResult.calculated_at)} — v${selectedResult.calculation_version}`
                  : 'Not yet calculated for this line.' }}
              </p>
            </div>
          </div>
          <UButton
            label="Calculate"
            icon="i-lucide-play"
            color="primary"
            :loading="calculating"
            :disabled="!isEditable || !hasBaseForSelected"
            @click="emit('calculate')"
          />
        </div>

        <!-- Result cards -->
        <div v-if="selectedResult" class="px-5 py-4">
          <!-- Status banner -->
          <div
            class="flex items-center gap-3 px-4 py-3 rounded-lg mb-4"
            :class="selectedResult.status === 'POSSIBLE'
              ? 'bg-success-50 dark:bg-success-950 border border-success-200 dark:border-success-800'
              : 'bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800'"
          >
            <UIcon
              :name="selectedResult.status === 'POSSIBLE' ? 'i-lucide-check-circle-2' : 'i-lucide-x-circle'"
              class="w-5 h-5 flex-shrink-0"
              :class="selectedResult.status === 'POSSIBLE' ? 'text-success-600' : 'text-error-600'"
            />
            <div>
              <p class="text-sm font-semibold" :class="selectedResult.status === 'POSSIBLE' ? 'text-success-700 dark:text-success-400' : 'text-error-700 dark:text-error-400'">
                {{ overallStatusLabel[selectedResult.status] ?? selectedResult.status }}
              </p>
              <p class="text-xs text-muted mt-0.5">
                Gap:
                <span class="font-mono font-semibold" :class="Number(selectedResult.capacity_gap_minutes) >= 0 ? 'text-success-600' : 'text-error-600'">
                  {{ Number(selectedResult.capacity_gap_minutes) >= 0 ? '+' : '' }}{{ fmtMinutes(selectedResult.capacity_gap_minutes) }}
                </span>
                &nbsp;·&nbsp; Utilization:
                <span class="font-mono font-semibold" :class="utilizationColor(selectedResult.utilization_pct)">
                  {{ fmtPercent(selectedResult.utilization_pct) }}
                </span>
              </p>
            </div>
          </div>

          <!-- Metrics grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div
              v-for="metric in [
                { label: 'Capacity',     value: fmtMinutes(selectedResult.total_capacity_minutes),  icon: 'i-lucide-clock-3',      sub: 'available' },
                { label: 'Required',     value: fmtMinutes(selectedResult.total_required_minutes),   icon: 'i-lucide-clock-alert',  sub: 'needed' },
                { label: 'Stations',     value: selectedResult.total_stations ?? '—',                icon: 'i-lucide-layout-grid',  sub: 'active' },
                { label: 'Jobs',         value: selectedResult.total_jobs ?? '—',                    icon: 'i-lucide-wrench',       sub: 'active' },
                { label: 'Takt Time',    value: fmtSeconds(selectedResult.max_takt_time),            icon: 'i-lucide-timer',        sub: 'bottleneck' },
                { label: 'Output/hr',    value: selectedResult.capacity_per_hour ?? '—',             icon: 'i-lucide-zap',          sub: 'units' },
              ]"
              :key="metric.label"
              class="bg-elevated rounded-lg px-3 py-3"
            >
              <div class="flex items-center gap-1.5 mb-1.5">
                <UIcon :name="metric.icon" class="w-3.5 h-3.5 text-muted" />
                <p class="text-xs text-muted leading-none">{{ metric.label }}</p>
              </div>
              <p class="text-sm font-semibold font-mono">{{ metric.value }}</p>
              <p class="text-xs text-muted leading-none mt-0.5">{{ metric.sub }}</p>
            </div>
          </div>
        </div>

        <!-- No result yet -->
        <div v-else class="px-5 py-8 text-center">
          <UIcon name="i-lucide-bar-chart-2" class="w-8 h-8 text-muted mx-auto mb-2" />
          <p class="text-sm text-muted">
            {{ !hasBaseForSelected ? 'Save BASE parameters first, then calculate.' : 'Click Calculate to run capacity analysis.' }}
          </p>
        </div>
      </div>

    </template>
  </div>
</template>