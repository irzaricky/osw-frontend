<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import type { PlanDetail, CalendarDayPreview, AdjustmentType, CalendarAdjustment } from '../../../../types/production-plan/plan'

const props = defineProps<{
  currentPlan:        any
  editParamForm:      any
  calendarPreview:    CalendarDayPreview[]
  saving:             boolean
  calculating:        boolean
  calculatingAll:     boolean
  isEditable:         boolean
  fmtNum:             (n?: number | null) => string
  fmtDate:            (d?: string | null) => string
  overallStatusLabel: Record<string, string>
  overallStatusColor: Record<string, string>
}>()

const emit = defineEmits<{
  (e: 'save-param-edit'): void
  (e: 'calculate'): void
  (e: 'calculate-all'): void
  (e: 'add-adjustment', payload: any): void
  (e: 'update-adjustment', id: number, payload: any): void
  (e: 'delete-adjustment', id: number): void
}>()

// Param / result accessors
const param  = computed(() => props.currentPlan?.capacity_params?.[0]  ?? null)
const result = computed(() => props.currentPlan?.capacity_results?.[0] ?? null)

const assignedDetails = computed((): PlanDetail[] =>
  props.currentPlan?.details?.filter((d: PlanDetail) => d.assigned_line_id) ?? [],
)

const hasParam           = computed(() => param.value !== null)
const hasAssignedDetails = computed(() => assignedDetails.value.length > 0)
const isBusy             = computed(() => props.calculating || props.calculatingAll)

// Inline edit toggle
const editMode = ref(false)

function openEdit() { editMode.value = true }
function closeEdit() { editMode.value = false }
function saveAndClose() {
  emit('save-param-edit')
  editMode.value = false
}

// Calendar section state
const calendarCollapsed  = ref(true)
const calendarFullscreen = ref(false)

// Format helpers
function fmtPercent(v?: number | string | null) {
  if (v == null) return '—'
  const n = Number(v)
  return Number.isNaN(n) ? '—' : `${(n * (n <= 1 ? 100 : 1)).toFixed(1)}%`
}
function fmtMinutes(min?: number | null) {
  if (min == null) return '—'
  const sign   = min < 0 ? '-' : ''
  const absMin = Math.abs(min)
  const h = Math.floor(absMin / 60)
  const m = Math.round(absMin % 60)
  return h > 0 ? `${sign}${h}h ${m}m` : `${sign}${m}m`
}
function fmtSeconds(sec?: number | null) {
  if (sec == null) return '—'
  return sec >= 60 ? `${(sec / 60).toFixed(1)} min` : `${sec}s`
}
function fmtDateTime(d?: string | null) {
  if (!d) return '—'
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleString()
}
function utilizationColor(pct?: number | null) {
  if (pct == null) return 'text-muted'
  if (pct <= 80)   return 'text-success-600'
  if (pct <= 95)   return 'text-warning-600'
  return 'text-error-600'
}

function fmtGap(n?: number | string | null): string {
  if (n == null) return '-'
  const num = Number(n)
  if (Number.isNaN(num)) return '-'
  const abs = Math.abs(num)
  // Drop decimals when value is an integer
  const formatted = Number.isInteger(abs) ? abs.toLocaleString('en-US') : abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  return `${num >= 0 ? '+' : '-'}${formatted}`
}

// Calendar constants
const MAX_SHIFTS     = 3
const MAX_OT_MINUTES = 120

// Calendar offset to align day-1 to the correct weekday column
const calendarOffset = computed<number>(() => {
  if (!props.calendarPreview.length) return 0
  return new Date(props.calendarPreview[0].date).getUTCDay()
})

// Collect all unique shift groups from calendar preview
const allShiftGroups = computed(() => {
  const map = new Map<number, string>()
  for (const day of props.calendarPreview) {
    for (const s of day.base_shifts) {
      if (s.shift && !map.has(s.shift.shift_number)) {
        map.set(s.shift.shift_number, s.shift.name)
      }
    }
  }
  if (map.size === 0) {
    map.set(1, 'Shift 1')
    map.set(2, 'Shift 2')
    map.set(3, 'Shift 3')
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([shift_number, name]) => ({ shift_number, name }))
})

// Day helpers
function getUsedShiftNumbersOnDay(day: CalendarDayPreview): Set<number> {
  const set = new Set<number>()
  for (const s of day.base_shifts) {
    if (s.shift) set.add(s.shift.shift_number)
  }
  for (const adj of day.adjustments) {
    if (adj.adjustment_type === 'ADD_SHIFT' && adj.shift?.shift_number != null) {
      set.add(adj.shift.shift_number)
    }
  }
  return set
}

function existingOtOnDay(day: CalendarDayPreview): number {
  return day.adjustments
    .filter(a => a.adjustment_type === 'ADD_OVERTIME')
    .reduce((sum, a) => sum + (a.overtime_minutes ?? 0), 0)
}

function existingOtByShiftOnDay(day: CalendarDayPreview): Map<number, number> {
  const map = new Map<number, number>()
  for (const adj of day.adjustments.filter(a => a.adjustment_type === 'ADD_OVERTIME')) {
    const sn = adj.shift?.shift_number
    if (sn != null) map.set(sn, (map.get(sn) ?? 0) + (adj.overtime_minutes ?? 0))
  }
  return map
}

// Map shift_number to its existing ADD_OVERTIME adjustment for update detection
function existingOtAdjustmentByShiftOnDay(day: CalendarDayPreview): Map<number, CalendarAdjustment> {
  const map = new Map<number, CalendarAdjustment>()
  for (const adj of day.adjustments.filter(a => a.adjustment_type === 'ADD_OVERTIME')) {
    const sn = adj.shift?.shift_number
    if (sn != null && !map.has(sn)) map.set(sn, adj)
  }
  return map
}

function getDayStatusLabel(day: CalendarDayPreview): string {
  if (day.master_status === 'UNINITIALIZED') return 'Uninitialized'
  if (day.master_status === 'HOLIDAY')       return 'Holiday'
  return 'Working Day'
}

function getDayShiftLabel(day: CalendarDayPreview): string {
  return `${getUsedShiftNumbersOnDay(day).size}/${MAX_SHIFTS} shifts`
}

// Calendar cell styling
function getDayCellClass(day: CalendarDayPreview) {
  const hasShiftAdj = day.adjustments.some(a => a.adjustment_type === 'ADD_SHIFT')
  return {
    'bg-success-50 border-success-200 dark:bg-success-950 dark:border-success-800':
      day.master_status === 'WORKING_DAY' && !hasShiftAdj,
    'bg-error-50 border-error-200 dark:bg-error-950 dark:border-error-800':
      day.master_status === 'HOLIDAY' && !hasShiftAdj,
    'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800':
      (day.master_status === 'HOLIDAY' || day.master_status === 'UNINITIALIZED') && hasShiftAdj,
    'bg-elevated border-default':
      day.master_status === 'UNINITIALIZED' && !hasShiftAdj,
    'cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all': props.isEditable,
  }
}

const adjustmentTypeLabel: Record<AdjustmentType, string> = {
  ADD_SHIFT:    'Add Shift',
  ADD_OVERTIME: 'Overtime',
}

function getAdjBadgeClass(type: AdjustmentType) {
  return {
    'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300': type === 'ADD_SHIFT',
    'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300': type === 'ADD_OVERTIME',
  }
}

function getAdjLabel(adj: CalendarAdjustment) {
  if (adj.adjustment_type === 'ADD_SHIFT') return `+${adj.shift?.name ?? 'Shift'}`
  return `+${adj.overtime_minutes}m OT`
}

function getDayAdjSummary(day: CalendarDayPreview): { shiftCount: number; otMinutes: number } {
  let shiftCount = 0
  let otMinutes  = 0
  for (const adj of day.adjustments) {
    if (adj.adjustment_type === 'ADD_SHIFT') shiftCount += 1
    else if (adj.adjustment_type === 'ADD_OVERTIME') otMinutes += adj.overtime_minutes ?? 0
  }
  return { shiftCount, otMinutes }
}

// Shift input row type
interface ShiftInputRow {
  shift_number:      number
  name:              string
  isAlreadyActive:   boolean
  addShift:          boolean
  overtimeMinutes:   number | null
  existingOtMinutes: number
  existingOtAdjId:   number | null
}

// Day modal (batch add)
const dayModal = reactive({
  open:        false,
  day:         null as CalendarDayPreview | null,
  reason:      '',
  shiftInputs: [] as ShiftInputRow[],
})

function openDayModal(day: CalendarDayPreview) {
  if (!props.isEditable) return

  const usedShifts   = getUsedShiftNumbersOnDay(day)
  const otByShift    = existingOtByShiftOnDay(day)
  const otAdjByShift = existingOtAdjustmentByShiftOnDay(day)

  dayModal.shiftInputs = allShiftGroups.value.map(s => ({
    shift_number:      s.shift_number,
    name:              s.name,
    isAlreadyActive:   usedShifts.has(s.shift_number),
    addShift:          false,
    overtimeMinutes:   null,
    existingOtMinutes: otByShift.get(s.shift_number) ?? 0,
    existingOtAdjId:   otAdjByShift.get(s.shift_number)?.id ?? null,
  }))

  dayModal.day    = day
  dayModal.reason = ''
  dayModal.open   = true
}

function closeDayModal() {
  dayModal.open        = false
  dayModal.day         = null
  dayModal.reason      = ''
  dayModal.shiftInputs = []
}

const availableNewShiftSlots = computed(() => {
  if (!dayModal.day) return 0
  const currentActive = getUsedShiftNumbersOnDay(dayModal.day).size
  return Math.max(0, MAX_SHIFTS - currentActive)
})

const newShiftsSelected = computed(() =>
  dayModal.shiftInputs.filter(s => !s.isAlreadyActive && s.addShift).length
)

const canSubmit = computed(() => {
  return dayModal.shiftInputs.some(s => {
    if (!s.isAlreadyActive && s.addShift) return true
    if ((s.isAlreadyActive || s.addShift) && s.overtimeMinutes != null && s.overtimeMinutes > 0) return true
    return false
  })
})

function handleSubmit() {
  if (!dayModal.day || !canSubmit.value) return

  // New shifts to activate (ADD_SHIFT) with optional new overtime
  const newShifts = dayModal.shiftInputs
    .filter(s => !s.isAlreadyActive && s.addShift)
    .map(s => ({
      shift_number:     s.shift_number,
      overtime_minutes: s.overtimeMinutes != null && s.overtimeMinutes > 0 ? s.overtimeMinutes : null,
    }))

  // Overtime for active shifts that do NOT yet have an ADD_OVERTIME record (new overtime)
  const newOvertimeOnExistingShift = dayModal.shiftInputs
    .filter(s =>
      s.isAlreadyActive &&
      s.existingOtAdjId == null &&
      s.overtimeMinutes != null && s.overtimeMinutes > 0,
    )
    .map(s => ({
      shift_number:     s.shift_number,
      overtime_minutes: s.overtimeMinutes,
    }))

  // Overtime for shifts that ALREADY have an ADD_OVERTIME record (must use update)
  const overtimeUpdates = dayModal.shiftInputs
    .filter(s =>
      s.existingOtAdjId != null &&
      s.overtimeMinutes != null && s.overtimeMinutes > 0,
    )
    .map(s => ({
      id:               s.existingOtAdjId as number,
      // Accumulate existing overtime with the newly entered minutes
      overtime_minutes: (s.existingOtMinutes ?? 0) + (s.overtimeMinutes as number),
    }))

  // Combine entries that go through add-adjustment
  const addShifts = [...newShifts, ...newOvertimeOnExistingShift]

  if (addShifts.length > 0) {
    emit('add-adjustment', {
      date:   dayModal.day.date,
      shifts: addShifts,
    })
  }

  // Existing overtime records go through update-adjustment
  for (const upd of overtimeUpdates) {
    emit('update-adjustment', upd.id, { overtime_minutes: upd.overtime_minutes })
  }

  closeDayModal()
}

// Edit overtime modal
const editOtModal = reactive({
  open:             false,
  adj:              null as CalendarAdjustment | null,
  overtime_minutes: null as number | null,
})

function openEditOtModal(adj: CalendarAdjustment) {
  editOtModal.adj              = adj
  editOtModal.overtime_minutes = adj.overtime_minutes ?? null
  editOtModal.open             = true
}

function closeEditOtModal() {
  editOtModal.open             = false
  editOtModal.adj              = null
  editOtModal.overtime_minutes = null
}

const editOtRemaining = computed(() => {
  if (!editOtModal.adj || !dayModal.day) return MAX_OT_MINUTES
  const shiftNum      = editOtModal.adj.shift?.shift_number
  const otByShift     = existingOtByShiftOnDay(dayModal.day)
  const totalForShift = otByShift.get(shiftNum ?? -1) ?? 0
  const thisRecord    = editOtModal.adj.overtime_minutes ?? 0
  return MAX_OT_MINUTES - (totalForShift - thisRecord)
})

function handleEditOtSubmit() {
  if (!editOtModal.adj || !editOtModal.overtime_minutes) return
  if (editOtModal.overtime_minutes < 1 || editOtModal.overtime_minutes > editOtRemaining.value) return
  emit('update-adjustment', editOtModal.adj.id, { overtime_minutes: editOtModal.overtime_minutes })
  closeEditOtModal()
}

// Always points to the freshest day data from calendarPreview
const activeDay = computed(() => {
  if (!dayModal.day) return null
  return props.calendarPreview.find(d => d.date === dayModal.day!.date) ?? dayModal.day
})

// Sort by shift_number, then ADD_SHIFT before ADD_OVERTIME
const sortedAdjustments = computed(() => {
  if (!activeDay.value) return []
  const order = { ADD_SHIFT: 0, ADD_OVERTIME: 1 }
  return [...activeDay.value.adjustments].sort((a, b) => {
    const sa = a.shift?.shift_number ?? 0
    const sb = b.shift?.shift_number ?? 0
    if (sa !== sb) return sa - sb
    return order[a.adjustment_type] - order[b.adjustment_type]
  })
})

// Delete confirmation
const confirmDeleteId  = ref<number | null>(null)
const confirmDeleteDay = ref<string | null>(null)

function requestDelete(adjId: number, date: string) {
  confirmDeleteId.value  = adjId
  confirmDeleteDay.value = date
}
</script>

<template>
  <div class="mt-4 space-y-5">

    <!-- No params state -->
    <div
      v-if="!hasParam"
      class="bg-default border border-dashed border-default rounded-xl px-5 py-10 text-center"
    >
      <UIcon name="i-lucide-alert-circle" class="w-8 h-8 text-warning-500 mx-auto mb-2" />
      <p class="text-sm text-muted font-medium">No capacity parameters configured.</p>
      <p class="text-xs text-muted mt-1">
        Capacity parameters are auto-created from the line master when the plan is created.
        If missing, ensure the production line has capacity parameters set up in Master Data.
      </p>
    </div>

    <template v-else>

      <!-- 1. Capacity Parameters -->
      <div class="bg-default border border-default rounded-xl">
        <div class="px-5 py-4 border-b border-default flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-database" class="w-4 h-4 text-primary" />
            <div>
              <h3 class="font-semibold text-sm">Capacity Parameters</h3>
              <p class="text-xs text-muted mt-0.5">
                {{ param.param_type === 'adjusted'
                  ? 'Manpower & efficiency manually adjusted. Calendar parameters are auto-calculated.'
                  : 'Snapshot from line master. Working days & shifts are auto-calculated from the effective calendar.' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UBadge
              :label="param.param_type === 'adjusted' ? 'Adjusted' : 'Base'"
              :color="param.param_type === 'adjusted' ? 'warning' : 'success'"
              variant="soft"
              size="sm"
            />
            <span v-if="param.line" class="text-xs text-muted font-medium">
              Line: {{ param.line.name }}
            </span>
            <UButton
              v-if="isEditable && !editMode"
              label="Edit"
              icon="i-lucide-pencil"
              variant="outline"
              color="neutral"
              size="xs"
              :disabled="isBusy"
              @click="openEdit"
            />
            <UButton
              v-if="editMode"
              label="Cancel"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="closeEdit"
            />
          </div>
        </div>

        <div class="px-5 py-4">
          <!-- Parameter grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <div
              v-for="item in [
                { label: 'Working Days',  value: param.working_days,            unit: 'days',  readonly: true,  note: 'Auto from calendar' },
                { label: 'Shifts / Day',  value: param.shifts_per_day,          unit: 'shift', readonly: true,  note: 'Auto from calendar' },
                { label: 'Hours / Shift', value: param.working_hours_per_shift, unit: 'hrs',   readonly: true,  note: 'From line master' },
                { label: 'Manpower',      value: param.manpower,                unit: 'pax',   readonly: false, note: null },
                { label: 'Efficiency',    value: null, isEfficiency: true,       raw: param.efficiency_factor, readonly: false, note: null },
                { label: 'Overtime',      value: param.overtime_hours,          unit: 'hrs',   readonly: true,  note: 'Auto from calendar' },
                { label: 'Max Takt Time', value: null, isTakt: true,            raw: param.max_takt_time,      readonly: true,  note: 'From line master' },
              ]"
              :key="item.label"
              class="bg-elevated rounded-lg px-3 py-3 space-y-1"
              :class="item.readonly ? 'opacity-80' : ''"
            >
              <div class="flex items-center justify-between">
                <p class="text-xs text-muted leading-none">{{ item.label }}</p>
                <UIcon
                  v-if="item.readonly"
                  name="i-lucide-lock"
                  class="w-3 h-3 text-muted/50"
                  :title="item.note ?? 'Read-only'"
                />
              </div>
              <p class="text-sm font-semibold font-mono leading-none">
                <template v-if="item.isEfficiency">
                  {{ item.raw != null ? `${(Number(item.raw) * 100).toFixed(0)}%` : '—' }}
                </template>
                <template v-else-if="item.isTakt">
                  {{ fmtSeconds(item.raw as number | null) }}
                </template>
                <template v-else>
                  {{ item.value ?? '—' }}
                  <span v-if="item.value != null" class="text-xs font-normal text-muted ml-0.5">{{ item.unit }}</span>
                </template>
              </p>
              <p v-if="item.note" class="text-[10px] text-muted/70 leading-none">{{ item.note }}</p>
            </div>
          </div>

          <!-- Inline edit form -->
          <Transition name="slide-down">
            <div v-if="editMode" class="mt-4 pt-4 border-t border-default">
              <p class="text-xs text-muted mb-3 flex items-center gap-1.5">
                <UIcon name="i-lucide-info" class="w-3.5 h-3.5" />
                Only <strong>Manpower</strong> and <strong>Efficiency</strong> can be edited manually.
                Calendar parameters update automatically when the calendar changes.
              </p>
              <div class="flex flex-wrap items-end gap-4">
                <UFormField label="Manpower">
                  <UInput
                    v-model.number="editParamForm.manpower"
                    type="number" min="1"
                    class="w-32 font-mono"
                    :disabled="saving || isBusy"
                  />
                </UFormField>
                <UFormField label="Efficiency (0 – 1)">
                  <UInput
                    v-model.number="editParamForm.efficiency_factor"
                    type="number" min="0" max="1" step="0.01"
                    class="w-32 font-mono"
                    :disabled="saving || isBusy"
                  />
                </UFormField>
                <UButton
                  label="Save"
                  icon="i-lucide-save"
                  color="primary"
                  :loading="saving"
                  :disabled="isBusy"
                  @click="saveAndClose"
                />
              </div>
            </div>
          </Transition>

          <!-- Products routed through this line -->
          <div v-if="hasAssignedDetails" class="mt-4 pt-4 border-t border-default">
            <p class="text-xs font-medium text-muted mb-2">
              Products routed through this line:
              <span class="font-semibold text-default ml-1">{{ assignedDetails.length }}</span>
            </p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="detail in assignedDetails"
                :key="detail.id"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border border-default"
              >
                <span class="font-medium">{{ detail.part?.part_number ?? `Part #${detail.part_id}` }}</span>
                <span class="text-muted font-mono">{{ fmtNum(detail.qty_request) }}</span>
              </span>
            </div>
          </div>
          <p v-else class="mt-3 text-xs text-warning-600 flex items-center gap-1">
            <UIcon name="i-lucide-alert-circle" class="w-3.5 h-3.5" />
            No products are routed through this line. Check part routing configuration.
          </p>
        </div>
      </div>

      <!-- 2. Calendar Adjustment -->
      <div class="bg-default border border-default rounded-xl">

        <!-- Header — click to collapse, expand button for fullscreen -->
        <div
          class="px-5 py-4 border-b border-default flex items-start justify-between gap-3 cursor-pointer select-none"
          :class="calendarCollapsed ? 'border-transparent' : ''"
          @click="calendarCollapsed = !calendarCollapsed"
        >
          <div class="flex items-start gap-2 min-w-0">
            <UIcon name="i-lucide-calendar-plus" class="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 class="font-semibold text-sm">Calendar Adjustment</h3>
              <p class="text-xs text-muted mt-0.5">
                <span v-if="isEditable">Click a date to add or manage adjustments. </span>
                After changing the calendar, recalculate capacity for changes to take effect.
              </p>
            </div>
          </div>

          <!-- Expand fullscreen + collapse buttons with stopPropagation -->
          <div class="flex items-center gap-1.5 shrink-0" @click.stop>
            <UButton
              icon="i-lucide-maximize-2"
              size="xs"
              color="neutral"
              variant="outline"
              title="Expand fullscreen"
              @click="calendarFullscreen = true"
            />
            <UButton
              :icon="calendarCollapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
              size="xs"
              color="neutral"
              variant="outline"
              :title="calendarCollapsed ? 'Expand section' : 'Collapse section'"
              @click="calendarCollapsed = !calendarCollapsed"
            />
          </div>
        </div>

        <!-- Body with collapse animation -->
        <Transition name="slide-down">
          <div v-show="!calendarCollapsed">

            <!-- Legend -->
            <div class="px-5 pt-3 flex flex-wrap gap-3">
              <div class="flex items-center gap-1.5 text-xs">
                <span class="w-3 h-3 rounded-sm bg-success-200 dark:bg-success-800 border border-success-300"></span>
                Working Day (Master)
              </div>
              <div class="flex items-center gap-1.5 text-xs">
                <span class="w-3 h-3 rounded-sm bg-error-200 dark:bg-error-800 border border-error-300"></span>
                Holiday (Master)
              </div>
              <div class="flex items-center gap-1.5 text-xs">
                <span class="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-800 border border-amber-300"></span>
                Holiday / Uninitialized → Added as Working Day
              </div>
              <div class="flex items-center gap-1.5 text-xs">
                <span class="w-3 h-3 rounded-sm bg-elevated border border-default"></span>
                Uninitialized
              </div>
            </div>

            <!-- Fallback -->
            <div v-if="!calendarPreview.length" class="px-5 py-10 text-center text-muted">
              <UIcon name="i-lucide-calendar-x" class="w-8 h-8 mx-auto mb-2" />
              <p class="text-sm">No calendar data available.</p>
            </div>

            <template v-else>
              <!-- Day-of-week header -->
              <div class="px-5 pt-3">
                <div class="grid grid-cols-7 gap-1.5 mb-1">
                  <div
                    v-for="dow in ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']"
                    :key="dow"
                    class="text-center text-[10px] font-semibold text-muted uppercase"
                  >
                    {{ dow }}
                  </div>
                </div>
              </div>

              <div class="px-5 pb-4">
                <div class="grid grid-cols-7 gap-1.5">
                  <!-- Offset empty cells -->
                  <div
                    v-for="n in calendarOffset"
                    :key="`offset-${n}`"
                    class="min-h-[72px]"
                  />

                  <!-- Day cells -->
                  <div
                    v-for="day in calendarPreview"
                    :key="day.date"
                    class="rounded-lg border p-2 text-center text-xs min-h-[72px] flex flex-col gap-0.5"
                    :class="getDayCellClass(day)"
                    @click="openDayModal(day)"
                  >
                    <p class="font-semibold text-default">{{ new Date(day.date).getUTCDate() }}</p>

                    <template v-if="day.master_status === 'UNINITIALIZED' && !day.adjustments.some(a => a.adjustment_type === 'ADD_SHIFT')">
                      <p class="text-muted text-[9px] leading-tight">No master data</p>
                      <p v-if="isEditable" class="text-[9px] text-sky-400 mt-auto">+ Add shift</p>
                    </template>

                    <template v-else-if="day.is_holiday && !day.adjustments.some(a => a.adjustment_type === 'ADD_SHIFT')">
                      <p class="text-error-500 text-[10px]">Holiday</p>
                      <p v-if="isEditable" class="text-[9px] text-error-400 mt-auto">+ Add as working day</p>
                    </template>

                    <template v-else>
                      <p class="text-muted text-[10px]">{{ getDayShiftLabel(day) }}</p>
                      <div v-if="day.adjustments.length" class="flex flex-col gap-0.5 mt-0.5">
                        <span
                          v-if="getDayAdjSummary(day).shiftCount > 0"
                          class="text-[10px] px-1 rounded leading-4"
                          :class="getAdjBadgeClass('ADD_SHIFT')"
                        >
                          +{{ getDayAdjSummary(day).shiftCount }} Shift
                        </span>
                        <span
                          v-if="getDayAdjSummary(day).otMinutes > 0"
                          class="text-[10px] px-1 rounded leading-4"
                          :class="getAdjBadgeClass('ADD_OVERTIME')"
                        >
                          +{{ getDayAdjSummary(day).otMinutes }}m OT
                        </span>
                      </div>
                      <template v-if="isEditable">
                        <p v-if="getUsedShiftNumbersOnDay(day).size < MAX_SHIFTS" class="text-[9px] text-primary-400 mt-auto">+ Shift / OT</p>
                        <p v-else-if="existingOtOnDay(day) < MAX_OT_MINUTES * MAX_SHIFTS" class="text-[9px] text-warning-400 mt-auto">+ Overtime</p>
                        <p v-else class="text-[9px] text-muted mt-auto">Full</p>
                      </template>
                    </template>
                  </div>
                </div>
              </div>
            </template>

          </div>
        </Transition>
      </div>

      <!-- 3. Capacity Calculation + Result -->
      <div class="bg-default border border-default rounded-xl">
        <div class="px-5 py-4 border-b border-default flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-calculator" class="w-4 h-4 text-primary" />
            <div>
              <h3 class="font-semibold text-sm">Capacity Calculation</h3>
              <p class="text-xs text-muted mt-0.5">
                {{ result
                  ? `Last calculated ${fmtDateTime(result.calculated_at)}`
                  : 'Not yet calculated.' }}
              </p>
            </div>
          </div>
          <UButton
            label="Calculate"
            icon="i-lucide-play"
            color="primary"
            :loading="calculating || calculatingAll"
            :disabled="!isEditable || !hasAssignedDetails || isBusy"
            @click="emit('calculate')"
          />
        </div>

        <div v-if="result" class="px-5 py-4">
          <!-- Status banner -->
          <div
            class="flex items-center gap-3 px-4 py-3 rounded-lg mb-4"
            :class="result.status === 'POSSIBLE'
              ? 'bg-success-50 dark:bg-success-950 border border-success-200 dark:border-success-800'
              : 'bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800'"
          >
            <UIcon
              :name="result.status === 'POSSIBLE' ? 'i-lucide-check-circle-2' : 'i-lucide-x-circle'"
              class="w-5 h-5 flex-shrink-0"
              :class="result.status === 'POSSIBLE' ? 'text-success-600' : 'text-error-600'"
            />
            <div>
              <p
                class="text-sm font-semibold"
                :class="result.status === 'POSSIBLE' ? 'text-success-700 dark:text-success-400' : 'text-error-700 dark:text-error-400'"
              >
                {{ overallStatusLabel[result.status] ?? result.status }}
              </p>
              <p class="text-xs text-muted mt-0.5">
                Remaining time buffer:
                <span class="font-mono font-semibold text-default">
                  {{ fmtMinutes(result.capacity_gap_units * (result.max_takt_time / 60)) }}
                </span>
              </p>
            </div>
          </div>

          <!-- Metric cards -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div
              v-for="metric in [
                { label: 'Capacity Units', value: fmtNum(result.total_capacity_units),       icon: 'i-lucide-package-check', sub: 'available' },
                { label: 'Gap', value: `${fmtGap(result.capacity_gap_units)} unit`, icon: 'i-lucide-package', sub: 'vs demand' },
                { label: 'Utilization',    value: fmtPercent(result.utilization_pct),        icon: 'i-lucide-gauge',         sub: 'line load' },
                { label: 'Takt Time',      value: fmtSeconds(result.max_takt_time),          icon: 'i-lucide-timer',         sub: 'bottleneck' },
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

        <div v-else class="px-5 py-8 text-center">
          <UIcon name="i-lucide-bar-chart-2" class="w-8 h-8 text-muted mx-auto mb-2" />
          <p class="text-sm text-muted">
            {{ !hasAssignedDetails
              ? 'No products are routed through this line. Check part routing configuration.'
              : 'Click Calculate to run capacity analysis.' }}
          </p>
        </div>
      </div>

    </template>

    <!-- Calendar Fullscreen Modal -->
    <UModal
      :open="calendarFullscreen"
      :ui="{ content: 'sm:max-w-5xl' }"
      @update:open="(v) => { if (!v) calendarFullscreen = false }"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-calendar-plus" class="w-4 h-4 text-primary" />
          <span class="font-semibold text-sm">Calendar Adjustment</span>
        </div>
      </template>

      <template #body>
        <!-- Legend -->
        <div class="flex flex-wrap gap-3 mb-4">
          <div class="flex items-center gap-1.5 text-xs">
            <span class="w-3 h-3 rounded-sm bg-success-200 dark:bg-success-800 border border-success-300"></span>
            Working Day (Master)
          </div>
          <div class="flex items-center gap-1.5 text-xs">
            <span class="w-3 h-3 rounded-sm bg-error-200 dark:bg-error-800 border border-error-300"></span>
            Holiday (Master)
          </div>
          <div class="flex items-center gap-1.5 text-xs">
            <span class="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-800 border border-amber-300"></span>
            Holiday / Uninitialized → Added as Working Day
          </div>
          <div class="flex items-center gap-1.5 text-xs">
            <span class="w-3 h-3 rounded-sm bg-elevated border border-default"></span>
            Uninitialized
          </div>
        </div>

        <!-- Fallback -->
        <div v-if="!calendarPreview.length" class="py-10 text-center text-muted">
          <UIcon name="i-lucide-calendar-x" class="w-8 h-8 mx-auto mb-2" />
          <p class="text-sm">No calendar data available.</p>
        </div>

        <template v-else>
          <!-- Day-of-week header -->
          <div class="grid grid-cols-7 gap-2 mb-1">
            <div
              v-for="dow in ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']"
              :key="`fs-${dow}`"
              class="text-center text-[10px] font-semibold text-muted uppercase"
            >
              {{ dow }}
            </div>
          </div>

          <!-- Grid with larger cells since modal is wider -->
          <div class="grid grid-cols-7 gap-2">
            <div
              v-for="n in calendarOffset"
              :key="`fs-offset-${n}`"
              class="min-h-[88px]"
            />
            <div
              v-for="day in calendarPreview"
              :key="`fs-${day.date}`"
              class="rounded-lg border p-2 text-center text-xs min-h-[88px] flex flex-col gap-0.5"
              :class="getDayCellClass(day)"
              @click="openDayModal(day)"
            >
              <p class="font-semibold text-default">{{ new Date(day.date).getUTCDate() }}</p>

              <template v-if="day.master_status === 'UNINITIALIZED' && !day.adjustments.some(a => a.adjustment_type === 'ADD_SHIFT')">
                <p class="text-muted text-[9px] leading-tight">No master data</p>
                <p v-if="isEditable" class="text-[9px] text-sky-400 mt-auto">+ Add shift</p>
              </template>

              <template v-else-if="day.is_holiday && !day.adjustments.some(a => a.adjustment_type === 'ADD_SHIFT')">
                <p class="text-error-500 text-[10px]">Holiday</p>
                <p v-if="isEditable" class="text-[9px] text-error-400 mt-auto">+ Add as working day</p>
              </template>

              <template v-else>
                <p class="text-muted text-[10px]">{{ getDayShiftLabel(day) }}</p>
                <div v-if="day.adjustments.length" class="flex flex-col gap-0.5 mt-0.5">
                <span
                  v-if="getDayAdjSummary(day).shiftCount > 0"
                  class="text-[10px] px-1 rounded leading-4"
                  :class="getAdjBadgeClass('ADD_SHIFT')"
                >
                  +{{ getDayAdjSummary(day).shiftCount }} Shift
                </span>
                <span
                  v-if="getDayAdjSummary(day).otMinutes > 0"
                  class="text-[10px] px-1 rounded leading-4"
                  :class="getAdjBadgeClass('ADD_OVERTIME')"
                >
                  +{{ getDayAdjSummary(day).otMinutes }}m OT
                </span>
              </div>
                <template v-if="isEditable">
                  <p v-if="getUsedShiftNumbersOnDay(day).size < MAX_SHIFTS" class="text-[9px] text-primary-400 mt-auto">+ Shift / OT</p>
                  <p v-else-if="existingOtOnDay(day) < MAX_OT_MINUTES * MAX_SHIFTS" class="text-[9px] text-warning-400 mt-auto">+ Overtime</p>
                  <p v-else class="text-[9px] text-muted mt-auto">Full</p>
                </template>
              </template>
            </div>
          </div>
        </template>
      </template>

      <template #footer>
        <div class="flex justify-end w-full">
          <UButton label="Close" color="neutral" variant="outline" @click="calendarFullscreen = false" />
        </div>
      </template>
    </UModal>

    <!-- Day Adjustment Modal -->
    <UModal
      :open="dayModal.open"
      :title="dayModal.day ? fmtDate(dayModal.day.date) : ''"
      :ui="{ content: 'sm:max-w-lg' }"
      @update:open="(v) => { if (!v) closeDayModal() }"
    >
      <template v-if="dayModal.day" #body>
        <div class="space-y-4">

          <!-- Day status summary -->
          <div class="rounded-lg bg-elevated p-3 space-y-1.5">
            <p class="text-xs font-semibold text-muted uppercase tracking-wide">Day Status</p>
            <div class="flex flex-wrap gap-2">
              <UBadge
                :label="getDayStatusLabel(dayModal.day)"
                :color="dayModal.day.master_status === 'WORKING_DAY' ? 'success' : dayModal.day.master_status === 'HOLIDAY' ? 'error' : 'neutral'"
                variant="soft"
                size="sm"
              />
              <UBadge
                v-if="dayModal.day.adjustments.some(a => a.adjustment_type === 'ADD_SHIFT')"
                label="Added as Working Day"
                color="warning"
                variant="soft"
                size="sm"
              />
              <UBadge
                :label="`${getUsedShiftNumbersOnDay(dayModal.day).size}/${MAX_SHIFTS} Shifts Active`"
                color="primary"
                variant="soft"
                size="sm"
              />
            </div>
            <p v-if="getUsedShiftNumbersOnDay(dayModal.day).size > 0" class="text-xs text-muted">
              Active shifts:
              <span class="font-medium text-default">
                {{ [...getUsedShiftNumbersOnDay(dayModal.day)].sort().map(n => `Shift ${n}`).join(', ') }}
              </span>
            </p>
          </div>

          <!-- Existing adjustments -->
          <div v-if="dayModal.day.adjustments.length > 0">
            <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Active Adjustments</p>
            <div class="space-y-1.5">
              <div
                v-for="adj in sortedAdjustments"
                :key="adj.id"
                class="flex items-center justify-between px-3 py-2 rounded-lg border border-default bg-elevated/50"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="text-xs px-1.5 py-0.5 rounded font-medium"
                    :class="getAdjBadgeClass(adj.adjustment_type)"
                  >
                    {{ adjustmentTypeLabel[adj.adjustment_type] }}
                  </span>
                  <span class="text-xs text-muted">
                    <template v-if="adj.adjustment_type === 'ADD_SHIFT'">
                      {{ adj.shift?.name }}
                    </template>
                    <template v-else-if="adj.adjustment_type === 'ADD_OVERTIME'">
                      {{ adj.overtime_minutes }} min · {{ adj.shift?.name }}
                    </template>
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <UButton
                    v-if="isEditable && adj.adjustment_type === 'ADD_OVERTIME'"
                    icon="i-lucide-pencil"
                    color="warning"
                    variant="ghost"
                    size="xs"
                    :disabled="saving"
                    @click="openEditOtModal(adj)"
                  />
                  <UButton
                    v-if="isEditable"
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    :disabled="saving"
                    @click="requestDelete(adj.id, dayModal.day!.date)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Add new shifts / overtime -->
          <template v-if="isEditable">
            <div class="border-t border-default pt-4">
              <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                Add Shifts &amp; Overtime
              </p>
              <p class="text-xs text-muted mb-3">
                Check a shift to activate it. Optionally set overtime minutes per shift (max {{ MAX_OT_MINUTES }} min each).
                <span v-if="availableNewShiftSlots === 0" class="text-warning-600 font-medium">
                  All shift slots are filled.
                </span>
                <span v-else class="text-primary font-medium">
                  {{ availableNewShiftSlots }} slot(s) remaining.
                </span>
              </p>

              <div class="space-y-2">
                <div
                  v-for="s in dayModal.shiftInputs"
                  :key="s.shift_number"
                  class="rounded-lg border p-3 transition-colors"
                  :class="s.isAlreadyActive
                    ? 'border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-950'
                    : s.addShift
                      ? 'border-primary bg-primary/5'
                      : 'border-default'"
                >
                  <label class="flex items-center cursor-pointer justify-between">
                    <div class="flex items-center gap-2 select-none">
                      <UCheckbox
                        v-model="s.addShift"
                        :disabled="s.isAlreadyActive || (!s.addShift && newShiftsSelected >= availableNewShiftSlots)"
                      />
                      <span class="text-sm font-medium">
                        {{ s.name }}
                      </span>
                    </div>
                    <UBadge
                      v-if="s.isAlreadyActive"
                      label="Active"
                      color="success"
                      variant="soft"
                      size="xs"
                    />
                    <UBadge
                      v-else-if="s.addShift"
                      label="Will be added"
                      color="primary"
                      variant="soft"
                      size="xs"
                    />
                  </label>

                  <div
                    v-if="s.isAlreadyActive || s.addShift"
                    class="mt-2 pl-6 flex items-center gap-3"
                  >
                    <div class="flex flex-col">
                      <label class="text-xs text-muted mb-1">
                        Overtime (min)
                        <span v-if="s.existingOtMinutes > 0" class="text-warning-600">
                          · {{ s.existingOtMinutes }} min already set
                        </span>
                      </label>
                      <UInput
                        v-model.number="s.overtimeMinutes"
                        type="number"
                        min="1"
                        :max="MAX_OT_MINUTES - s.existingOtMinutes"
                        placeholder="optional"
                        class="w-32 font-mono"
                        size="sm"
                        :disabled="MAX_OT_MINUTES - s.existingOtMinutes <= 0"
                      />
                      <p class="text-[10px] text-muted mt-0.5">
                        Remaining: {{ MAX_OT_MINUTES - s.existingOtMinutes }} min
                      </p>
                    </div>
                    <p
                      v-if="s.overtimeMinutes != null && s.overtimeMinutes > (MAX_OT_MINUTES - s.existingOtMinutes)"
                      class="text-xs text-error-600 self-center"
                    >
                      Exceeds limit
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton label="Close" color="neutral" variant="ghost" @click="closeDayModal" />
          <UButton
            v-if="isEditable"
            label="Save Adjustments"
            icon="i-lucide-plus"
            color="primary"
            :loading="saving"
            :disabled="!canSubmit"
            @click="handleSubmit"
          />
        </div>
      </template>
    </UModal>

    <!-- Edit Overtime Modal -->
    <UModal
      :open="editOtModal.open"
      title="Edit Overtime"
      :ui="{ content: 'sm:max-w-sm' }"
      @update:open="(v) => { if (!v) closeEditOtModal() }"
    >
      <template v-if="editOtModal.adj" #body>
        <div class="space-y-3">
          <p class="text-sm text-muted">
            Editing overtime for
            <span class="font-medium text-default">{{ editOtModal.adj.shift?.name }}</span>
            on {{ fmtDate(editOtModal.adj.date) }}.
          </p>
          <p class="text-xs text-muted">
            Max allowed for this shift: <span class="font-mono font-medium">{{ editOtRemaining }} min</span>
            (other overtime records on this shift are excluded).
          </p>
          <UFormField label="Overtime Duration (minutes)" required>
            <UInput
              v-model.number="editOtModal.overtime_minutes"
              type="number"
              min="1"
              :max="editOtRemaining"
              class="w-full font-mono"
            />
            <p
              v-if="editOtModal.overtime_minutes != null && editOtModal.overtime_minutes > editOtRemaining"
              class="text-xs text-error-600 mt-1"
            >
              Exceeds remaining overtime quota ({{ editOtRemaining }} min).
            </p>
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton label="Cancel" color="neutral" variant="ghost" @click="closeEditOtModal" />
          <UButton
            label="Update"
            icon="i-lucide-save"
            color="primary"
            :loading="saving"
            :disabled="
              !editOtModal.overtime_minutes ||
              editOtModal.overtime_minutes < 1 ||
              editOtModal.overtime_minutes > editOtRemaining
            "
            @click="handleEditOtSubmit"
          />
        </div>
      </template>
    </UModal>

    <!-- Confirm Delete Modal -->
    <UModal
      :open="confirmDeleteId !== null"
      title="Delete Adjustment"
      description="This adjustment will be permanently deleted. Recalculate capacity to apply changes."
      @update:open="(v) => { if (!v) { confirmDeleteId = null; confirmDeleteDay = null } }"
    >
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="confirmDeleteId = null; confirmDeleteDay = null"
          />
          <UButton
            label="Delete"
            icon="i-lucide-trash-2"
            color="error"
            :loading="saving"
            @click="() => {
              if (confirmDeleteId !== null) emit('delete-adjustment', confirmDeleteId)
              confirmDeleteId  = null
              confirmDeleteDay = null
            }"
          />
        </div>
      </template>
    </UModal>

  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
}
.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 2000px;
}
</style>