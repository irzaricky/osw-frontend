<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, resolveComponent, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { z } from 'zod'
import { parseDate, type DateValue } from '@internationalized/date'

import { useOrderScheduleStore } from '../../../stores/production-plan/order-schedule.store'
import { useProductionPlanStore } from '../../../stores/production-plan/plan.store'
import { useAppToast } from '../../../composables/useAppToast'
import {
  poStatusLabel, poStatusColor, priorityColor, fmtDate, fmtNum,
  scheduledPct, utilClass, schedBadgeColor, dateRangeColumns, isWeekend,
  priorityOptions,
} from './composables/usePOUtils'

import type {
  ProductionOrder, POSchedule, UpdateSchedulePayload,
  ApprovePOPayload, RejectPOPayload, ReschedulePayload, POPriority,
} from '../../../types/production-plan/order-schedule'
import type { Range } from '../../../types'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import HomeDateRangePicker from '../../../components/home/HomeDateRangePicker.vue'
import OrderScheduleEditModal from './components/PoEditModal.vue'
import OrderScheduleRescheduleModal from './components/PoRescheduleModal.vue'
import OrderScheduleApproveModal from './components/PoApproveModal.vue'
import OrderScheduleRejectModal from './components/PoRejectModal.vue'

// ── Init ───────────────────────────────────────────────────────────────────────
const route  = useRoute()
const router = useRouter()
const store  = useOrderScheduleStore()
const planStore = useProductionPlanStore()
const { currentOrder, loading, saving, scheduleViolations } = storeToRefs(store)
const { toastSuccess, toastError } = useAppToast()
const UBadge = resolveComponent('UBadge')

const poId = computed(() => route.params.id as string)

// ── Breadcrumbs ────────────────────────────────────────────────────────────────
const breadcrumbItems = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Production Plan' },
  { label: 'Production Order', to: '/production-plan/order-schedule' },
  { label: currentOrder.value?.po_number || 'Detail' },
])

// ── Tabs ───────────────────────────────────────────────────────────────────────
const activeTab = ref('summary')
const tabs = [
  { key: 'summary',   label: 'Summary',             icon: 'i-lucide-layout-dashboard' },
  { key: 'products',  label: 'Products',             icon: 'i-lucide-package' },
  { key: 'schedule',  label: 'Schedule Table',       icon: 'i-lucide-table' },
  { key: 'gantt',     label: 'Gantt Chart',          icon: 'i-lucide-gantt-chart' },
  { key: 'resource',  label: 'Resource Allocation',  icon: 'i-lucide-bar-chart-2' },
  { key: 'logs',      label: 'Reschedule Logs',      icon: 'i-lucide-history' },
]

// ── Inline edit state ──────────────────────────────────────────────────────────
const isEditingInfo = ref(false)
const editSaving    = ref(false)

const editState = reactive({
  priority:              'Medium' as POPriority,
  production_start_date: '',
  production_end_date:   '',
  po_description:        '',
})

const editDateRange = ref<Range | undefined>(undefined)

watch(editDateRange, (val) => {
  editState.production_start_date = val?.start ? formatLocalDate(val.start) : ''
  editState.production_end_date   = val?.end   ? formatLocalDate(val.end)   : ''
})

function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function openEditInfo() {
  const o = currentOrder.value
  if (!o) return
  editState.priority              = o.priority
  editState.production_start_date = o.production_start_date
  editState.production_end_date   = o.production_end_date
  editState.po_description        = o.po_description ?? ''
  if (o.production_start_date && o.production_end_date) {
    const [sy, sm, sd] = o.production_start_date.split('-').map(Number)
    const [ey, em, ed] = o.production_end_date.split('-').map(Number)
    editDateRange.value = {
      start: new Date(sy, sm - 1, sd),
      end:   new Date(ey, em - 1, ed),
    }
  } else {
    editDateRange.value = undefined
  }
  isEditingInfo.value = true
}

function cancelEditInfo() {
  isEditingInfo.value = false
}

// BE _getPoEditable hanya mengizinkan status 'Draft' untuk diedit
const editSchema = z.object({
  priority:              z.enum(['Low', 'Medium', 'High']),
  production_start_date: z.string().min(1, 'Start date is required.'),
  production_end_date:   z.string().min(1, 'End date is required.'),
  po_description:        z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.production_start_date && data.production_end_date) {
    if (new Date(data.production_end_date) <= new Date(data.production_start_date)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End Date must be after Start Date.', path: ['production_end_date'] })
    }
  }
  const latest = currentOrder.value?.latest_delivery_date
  if (data.production_end_date && latest) {
    if (data.production_end_date >= latest) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `End Date must be before Latest Delivery Date (${fmtDate(latest)}).`, path: ['production_end_date'] })
    }
  }
})

const editErrors = reactive<Record<string, string>>({})

async function saveEditInfo() {
  Object.keys(editErrors).forEach(k => delete editErrors[k])

  const result = editSchema.safeParse(editState)
  if (!result.success) {
    result.error.errors.forEach(e => {
      const key = e.path[0] as string
      editErrors[key] = e.message
    })
    return
  }

  editSaving.value = true
  try {
    const res = await store.updateOrder(poId.value, {
      priority:              editState.priority,
      production_start_date: editState.production_start_date,
      production_end_date:   editState.production_end_date,
      po_description:        editState.po_description || undefined,
    })
    toastSuccess(res?.message || 'Production order updated.')
    isEditingInfo.value = false
    await fetchOrder()
  } catch (err) {
    toastError(err)
  } finally {
    editSaving.value = false
  }
}

const editIsDateDisabled = computed(() => {
  const latest = currentOrder.value?.latest_delivery_date
  if (!latest) return undefined
  const latestDate = parseDate(latest)
  return (date: DateValue) => date.compare(latestDate) >= 0
})

// ── Priority select helper ─────────────────────────────────────────────────────
const selectedEditPriority = computed({
  get() { return priorityOptions.find(p => p.value === editState.priority) ?? priorityOptions[1] },
  set(item: { label: string; value: POPriority } | undefined) { if (item) editState.priority = item.value },
})

// ── Modal state ────────────────────────────────────────────────────────────────
const editModal = reactive({ open: false, schedule: null as POSchedule | null })
const submitConfirm = reactive({
  open: false,
  title: 'Submit for Approval',
  description: 'Are you sure you want to submit this production order for approval? Ensure all schedules are correct before proceeding.',
})
const releaseConfirm = reactive({ open: false, title: 'Release Production Order', description: '' })
const rescheduleModal = ref(false)
const approveModal    = ref(false)
const rejectModal     = ref(false)

// ── Computed helpers ───────────────────────────────────────────────────────────
const order = computed(() => currentOrder.value)
const hasSchedule   = computed(() => !!order.value?.schedules?.length)
const canSubmit     = computed(() => order.value?.status === 'Draft' && hasSchedule.value)
const canApprove    = computed(() => order.value?.status === 'Pending_Approval')
const canReject     = computed(() => order.value?.status === 'Pending_Approval')
const canRelease    = computed(() => order.value?.status === 'Approved')
const canReschedule = computed(() => order.value?.status === 'Released')
// BE _getPoEditable hanya mengizinkan edit saat status 'Draft'
const canEditInfo   = computed(() => order.value?.status === 'Draft')
const isEditable    = computed(() => order.value?.status === 'Draft')

const pct = computed(() => scheduledPct(order.value?.total_planned_qty ?? 0, order.value?.total_scheduled_qty ?? 0))

const ganttDates = computed(() => {
  if (!order.value?.production_start_date || !order.value?.production_end_date) return []
  return dateRangeColumns(order.value.production_start_date, order.value.production_end_date)
})

const ganttRows = computed(() => {
  if (!order.value?.products || !order.value?.schedules) return []
  return order.value.products.map(product => {
    const schedsByDate: Record<string, POSchedule[]> = {}
    order.value!.schedules!
      .filter(s => s.po_product_id === product.id)
      .forEach(s => {
        if (!schedsByDate[s.production_date]) schedsByDate[s.production_date] = []
        schedsByDate[s.production_date].push(s)
      })
    return { product, schedsByDate }
  })
})

const resourceRows = computed(() => {
  if (!order.value?.schedules) return []

  const map: Record<string, Record<string, Record<string, {
    shiftName: string
    totalQty:  number
    capacity:  number
  }>>> = {}

  order.value.schedules.forEach(s => {
    const lineKey   = s.line?.name ?? s.line_name_snapshot ?? `Line ${s.line_id}`
    const shiftKey  = String(s.shift_id)
    const shiftName = s.shift?.name ?? s.shift_name_snapshot ?? `Shift ${s.shift_id}`
    const cap = s.line_capacity_per_day ?? 0

    if (!map[lineKey]) map[lineKey] = {}
    if (!map[lineKey][s.production_date]) map[lineKey][s.production_date] = {}

    if (!map[lineKey][s.production_date][shiftKey]) {
      map[lineKey][s.production_date][shiftKey] = { shiftName, totalQty: 0, capacity: cap }
    }

    map[lineKey][s.production_date][shiftKey].totalQty += s.planned_qty_per_day

    if (cap > map[lineKey][s.production_date][shiftKey].capacity) {
      map[lineKey][s.production_date][shiftKey].capacity = cap
    }
  })

  return Object.entries(map).map(([lineName, byDate]) => {
    const byDateResult: Record<string, {
      shifts:    { shiftName: string; qty: number; capacity: number; pct: number | null }[]
      totalQty:  number
      totalCap:  number
      dailyPct:  number | null
    }> = {}

    Object.entries(byDate).forEach(([date, shiftMap]) => {
      const shifts = Object.values(shiftMap).map(cell => ({
        shiftName: cell.shiftName,
        qty:       cell.totalQty,
        capacity:  cell.capacity,
        pct:       cell.capacity > 0
          ? Math.round((cell.totalQty / cell.capacity) * 100)
          : null,
      }))

      const totalQty = shifts.reduce((s, sh) => s + sh.qty, 0)
      const totalCap = shifts.reduce((s, sh) => s + sh.capacity, 0)

      byDateResult[date] = {
        shifts,
        totalQty,
        totalCap,
        dailyPct: totalCap > 0 ? Math.round((totalQty / totalCap) * 100) : null,
      }
    })

    return { lineName, byDate: byDateResult }
  })
})

// ── Data fetch ─────────────────────────────────────────────────────────────────
async function fetchOrder() {
  try {
    await store.fetchOrder(poId.value)
  } catch {
    toastError('Failed to load production order.')
    router.push('/production-plan/order-schedule')
  }
}

// ── Actions ────────────────────────────────────────────────────────────────────
async function handleGenerateSchedule() {
  try {
    const res = await store.generateSchedule(poId.value)
    toastSuccess(res.message || 'Schedule generated successfully.')
    await fetchOrder()
    activeTab.value = 'schedule'
  } catch (err) { toastError(err) }
}

async function handleRecalculate() {
  try {
    const res = await store.generateSchedule(poId.value)
    toastSuccess(res.message || 'Schedule recalculated successfully.')
    await fetchOrder()
    activeTab.value = 'schedule'
  } catch (err) { toastError(err) }
}

async function handleSubmit() {
  try {
    const res = await store.submit(poId.value)
    toastSuccess(res.message || 'Production order submitted for approval.')
    submitConfirm.open = false
    await fetchOrder()
  } catch (err) { toastError(err); submitConfirm.open = false }
}

function openEditSchedule(schedule: POSchedule) {
  editModal.schedule = schedule
  editModal.open     = true
}

async function handleSaveSchedule(payload: UpdateSchedulePayload) {
  if (!editModal.schedule) return
  try {
    const res = await store.updateSchedule(poId.value, editModal.schedule.id, payload)
    toastSuccess(res.message || 'Schedule row updated.')
    editModal.open = false
    await fetchOrder()
  } catch (err) { toastError(err) }
}

async function handleApprove(payload: ApprovePOPayload) {
  try {
    const res = await store.approve(poId.value, payload)
    toastSuccess(res.message || 'Production order approved.')
    approveModal.value = false
    await fetchOrder()
  } catch (err) { toastError(err) }
}

async function handleReject(payload: RejectPOPayload) {
  try {
    const res = await store.reject(poId.value, payload)
    toastSuccess(res.message || 'Production order rejected.')
    rejectModal.value = false
    await fetchOrder()
  } catch (err) { toastError(err) }
}

function openReleaseConfirm() {
  const woCount = order.value?.schedules?.length ?? 0
  releaseConfirm.description = `Release this PO will create ${woCount} Work Order(s). This action is irreversible. Continue?`
  releaseConfirm.open = true
}

async function handleRelease() {
  try {
    const res = await store.release(poId.value)
    const woCreated = res.data?.work_orders_created ?? ''
    toastSuccess(res.message || `Production order released. ${woCreated} Work Order(s) generated.`)
    releaseConfirm.open = false
    await fetchOrder()
  } catch (err) { toastError(err); releaseConfirm.open = false }
}

async function handleReschedule(payload: ReschedulePayload) {
  try {
    const res = await store.reschedule(poId.value, payload)
    toastSuccess(res.message || 'Production order rescheduled.')
    rescheduleModal.value = false
    await fetchOrder()
  } catch (err) { toastError(err) }
}

onMounted(fetchOrder)
onUnmounted(() => store.clearCurrentOrder())
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <!-- Header -->
    <div class="flex flex-wrap justify-between items-start gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" @click="$router.push({name: 'order-schedule-list'})" />
          <h1 class="text-2xl font-bold font-mono">{{ order?.po_number ?? '—' }}</h1>
          <component :is="UBadge" v-if="order" :label="poStatusLabel[order.status]" :color="poStatusColor[order.status]" variant="subtle" />
          <component :is="UBadge" v-if="order" :label="order.priority" :color="priorityColor[order.priority]" variant="soft" size="sm" />
        </div>
        <p class="text-sm text-muted">
          Plan: <span class="font-mono font-medium">{{ order?.plan?.plan_number ?? '—' }}</span>
          <template v-if="order?.plan?.plan_description"> — {{ order.plan.plan_description }}</template>
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          v-if="canEditInfo && !isEditingInfo"
          icon="i-lucide-pencil"
          color="neutral"
          variant="outline"
          label="Edit Info"
          @click="openEditInfo"
        />

        <template v-if="order?.status === 'Draft'">
          <UButton v-if="!hasSchedule" icon="i-lucide-calendar-cog" color="primary" variant="solid" label="Generate Schedule" :loading="saving" @click="handleGenerateSchedule" />
          <template v-else>
            <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" label="Recalculate" :loading="saving" @click="handleRecalculate" />
            <UButton icon="i-lucide-send" color="primary" variant="solid" label="Submit for Approval" :loading="saving" @click="submitConfirm.open = true" />
          </template>
        </template>

        <template v-if="order?.status === 'Pending_Approval'">
          <UButton icon="i-lucide-x-circle" color="error" variant="outline" label="Reject" :loading="saving" @click="rejectModal = true" />
          <UButton icon="i-lucide-check-circle" color="success" variant="solid" label="Approve" :loading="saving" @click="approveModal = true" />
        </template>

        <template v-if="order?.status === 'Approved'">
          <UButton icon="i-lucide-rocket" color="primary" variant="solid" label="Release PO" :loading="saving" @click="openReleaseConfirm" />
        </template>

        <template v-if="order?.status === 'Released'">
          <UButton icon="i-lucide-calendar-x" color="warning" variant="outline" label="Reschedule" :loading="saving" @click="rescheduleModal = true" />
        </template>
      </div>
    </div>

    <!-- Rejection notice -->
    <UAlert v-if="order?.status === 'Rejected' && order.notes" icon="i-lucide-alert-triangle" color="error" variant="soft" :title="`Rejected: ${order.notes}`" description="Please revise this production order before resubmitting." />

    <!-- Capacity violations alert -->
    <UAlert
      v-if="scheduleViolations.length"
      icon="i-lucide-alert-circle"
      color="error"
      variant="soft"
      title="Kapasitas tidak mencukupi"
    >
      <template #description>
        <ul class="mt-1 space-y-1 text-xs">
          <li v-for="v in scheduleViolations" :key="v.line_id">
            <span class="font-semibold">{{ v.line_name }}</span> —
            {{ v.message }}
          </li>
        </ul>
      </template>
    </UAlert>

    <!-- Inline Edit Panel -->
    <Transition name="slide-down">
      <div v-if="isEditingInfo" class="bg-default border border-primary/40 rounded-xl p-5 space-y-4 shadow-sm">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-sm flex items-center gap-2">
            <UIcon name="i-lucide-pencil" class="size-4 text-primary" />
            Edit Production Order Info
          </h3>
          <p class="text-xs text-muted">
            Latest Delivery:
            <span class="font-mono font-medium text-error-600 dark:text-error-400">
              {{ fmtDate(order?.latest_delivery_date ?? '') }}
            </span>
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium text-muted uppercase tracking-wide">Priority <span class="text-error-500">*</span></label>
            <USelectMenu
              v-model="selectedEditPriority"
              :items="[priorityOptions]"
              value-attribute="value"
              option-attribute="label"
              placeholder="Select Priority"
              class="w-full"
            />
            <p v-if="editErrors.priority" class="text-xs text-error-500">{{ editErrors.priority }}</p>
          </div>

          <div class="md:col-span-2 space-y-1">
            <label class="text-xs font-medium text-muted uppercase tracking-wide">
              Production Date Range <span class="text-error-500">*</span>
            </label>
            <HomeDateRangePicker
              v-model="editDateRange"
              :is-date-disabled="editIsDateDisabled ?? undefined"
              clear
              class="w-full"
            />
            <p v-if="editErrors.production_start_date" class="text-xs text-error-500">{{ editErrors.production_start_date }}</p>
            <p v-else-if="editErrors.production_end_date" class="text-xs text-error-500">{{ editErrors.production_end_date }}</p>
            <p v-else class="text-xs text-muted">
              End Date must be before {{ fmtDate(order?.latest_delivery_date ?? '') }}.
            </p>
          </div>

          <div class="md:col-span-3 space-y-1">
            <label class="text-xs font-medium text-muted uppercase tracking-wide">Description</label>
            <UInput v-model="editState.po_description" placeholder="Optional notes or description..." class="w-full" />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-1">
          <UButton color="neutral" variant="outline" label="Cancel" :disabled="editSaving" @click="cancelEditInfo" />
          <UButton color="primary" variant="solid" label="Save Changes" :loading="editSaving" @click="saveEditInfo" />
        </div>
      </div>
    </Transition>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-64 w-full" />
    </div>

    <template v-else-if="order">
      <!-- KPI Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-default border border-default rounded-lg p-4 space-y-1">
          <p class="text-xs text-muted uppercase tracking-wide">Production Range</p>
          <p class="text-sm font-medium font-mono">
            {{ fmtDate(order.production_start_date) }} – {{ fmtDate(order.production_end_date) }}
          </p>
        </div>
        <div class="bg-default border border-default rounded-lg p-4 space-y-1">
          <p class="text-xs text-muted uppercase tracking-wide">Delivery Window</p>
          <p class="text-sm font-medium font-mono">
            {{ fmtDate(order.earliest_delivery_date) }} – {{ fmtDate(order.latest_delivery_date) }}
          </p>
        </div>
        <div class="bg-default border border-default rounded-lg p-4 space-y-1">
          <p class="text-xs text-muted uppercase tracking-wide">Total Products</p>
          <p class="text-2xl font-bold">{{ order.total_products }}</p>
        </div>
        <div class="bg-default border border-default rounded-lg p-4 space-y-1">
          <p class="text-xs text-muted uppercase tracking-wide">Scheduled / Planned Qty</p>
          <div class="flex items-end gap-2">
            <p class="text-2xl font-bold">{{ fmtNum(order.total_scheduled_qty) }}</p>
            <p class="text-sm text-muted pb-0.5">/ {{ fmtNum(order.total_planned_qty) }}</p>
          </div>
          <UProgress :value="pct" size="xs" :color="pct >= 100 ? 'success' : 'warning'" />
          <p class="text-xs text-muted">{{ pct }}% scheduled</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-default">
        <nav class="flex gap-1 overflow-x-auto">
          <button
            v-for="tab in tabs" :key="tab.key"
            class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
            :class="activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-default'"
            @click="activeTab = tab.key"
          >
            <UIcon :name="tab.icon" class="size-4" />
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- TAB: Summary -->
      <div v-show="activeTab === 'summary'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-default border border-default rounded-lg p-5 space-y-4">
          <h3 class="font-semibold text-sm uppercase tracking-wide text-muted">Order Info</h3>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between"><dt class="text-muted">PO Number</dt><dd class="font-mono font-semibold">{{ order.po_number }}</dd></div>
            <div class="flex justify-between"><dt class="text-muted">Plan</dt><dd class="font-mono">{{ order.plan?.plan_number ?? '—' }}</dd></div>
            <div class="flex justify-between">
              <dt class="text-muted">Status</dt>
              <dd><component :is="UBadge" :label="poStatusLabel[order.status]" :color="poStatusColor[order.status]" variant="subtle" size="sm" /></dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted">Priority</dt>
              <dd><component :is="UBadge" :label="order.priority" :color="priorityColor[order.priority]" variant="soft" size="sm" /></dd>
            </div>
            <div class="flex justify-between"><dt class="text-muted">Description</dt><dd class="text-right max-w-xs">{{ order.po_description || '—' }}</dd></div>
            <div class="flex justify-between"><dt class="text-muted">Notes</dt><dd class="text-right max-w-xs">{{ order.notes || '—' }}</dd></div>
          </dl>
        </div>

        <div class="bg-default border border-default rounded-lg p-5 space-y-4">
          <h3 class="font-semibold text-sm uppercase tracking-wide text-muted">Timeline & Audit</h3>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between"><dt class="text-muted">Start Date</dt><dd class="font-mono">{{ fmtDate(order.production_start_date) }}</dd></div>
            <div class="flex justify-between"><dt class="text-muted">End Date</dt><dd class="font-mono">{{ fmtDate(order.production_end_date) }}</dd></div>
            <div class="flex justify-between"><dt class="text-muted">Earliest Delivery</dt><dd class="font-mono">{{ fmtDate(order.earliest_delivery_date) }}</dd></div>
            <div class="flex justify-between"><dt class="text-muted">Latest Delivery</dt><dd class="font-mono">{{ fmtDate(order.latest_delivery_date) }}</dd></div>
            <div class="flex justify-between"><dt class="text-muted">Created By</dt><dd>{{ order.creator?.email ?? '—' }}</dd></div>
            <div class="flex justify-between"><dt class="text-muted">Released By</dt><dd>{{ order.releaser?.email ?? '—' }}</dd></div>
            <div class="flex justify-between"><dt class="text-muted">Released At</dt><dd class="font-mono">{{ order.released_at ? fmtDate(order.released_at) : '—' }}</dd></div>
          </dl>
        </div>
      </div>

      <!-- TAB: Products -->
      <div v-show="activeTab === 'products'">
        <div v-if="!order.products?.length" class="flex flex-col items-center justify-center py-16 text-muted gap-2">
          <UIcon name="i-lucide-package-x" class="size-12 opacity-40" />
          <p class="text-sm">No products found in this production order.</p>
        </div>
        <UTable
          v-else
          :data="order.products"
          :columns="[
            { header: '#', cell: ({ row }) => row.index + 1 },
            { accessorKey: 'part', header: 'Part', cell: ({ row }) => `${row.original.part?.part_number ?? '—'} — ${row.original.part?.part_name ?? ''}` },
            { accessorKey: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer?.name ?? '—' },
            { accessorKey: 'line', header: 'Line', cell: ({ row }) => row.original.line?.name ?? '—' },
            { accessorKey: 'delivery_date', header: 'Delivery Date', cell: ({ row }) => fmtDate(row.original.delivery_date) },
            { accessorKey: 'planned_qty', header: 'Planned Qty', cell: ({ row }) => fmtNum(row.original.planned_qty) },
            { accessorKey: 'scheduled_qty', header: 'Scheduled Qty', cell: ({ row }) => fmtNum(row.original.scheduled_qty) },
          ]"
          class="w-full"
        />
      </div>

      <!-- TAB: Schedule Table -->
      <div v-show="activeTab === 'schedule'">
        <div v-if="!hasSchedule" class="flex flex-col items-center justify-center py-16 text-muted gap-3">
          <UIcon name="i-lucide-calendar-off" class="size-12 opacity-40" />
          <p class="text-sm">No schedule generated yet.</p>
          <UButton v-if="order.status === 'Draft'" icon="i-lucide-calendar-cog" color="primary" variant="outline" label="Generate Schedule" :loading="saving" @click="handleGenerateSchedule" />
        </div>
        <template v-else>
          <div class="flex justify-end mb-3">
            <UButton v-if="isEditable" icon="i-lucide-refresh-cw" color="neutral" variant="outline" size="sm" label="Recalculate" :loading="saving" @click="handleRecalculate" />
          </div>
          <div class="overflow-x-auto rounded-lg border border-default">
            <table class="w-full text-sm">
              <thead class="bg-elevated">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold text-muted text-xs uppercase tracking-wide">Seq</th>
                  <th class="px-3 py-2 text-left font-semibold text-muted text-xs uppercase tracking-wide">Part</th>
                  <th class="px-3 py-2 text-left font-semibold text-muted text-xs uppercase tracking-wide">Line</th>
                  <th class="px-3 py-2 text-left font-semibold text-muted text-xs uppercase tracking-wide">Shift</th>
                  <th class="px-3 py-2 text-left font-semibold text-muted text-xs uppercase tracking-wide">Date</th>
                  <th class="px-3 py-2 text-right font-semibold text-muted text-xs uppercase tracking-wide">Plan Qty</th>
                  <th class="px-3 py-2 text-right font-semibold text-muted text-xs uppercase tracking-wide">Actual Qty</th>
                  <th class="px-3 py-2 text-right font-semibold text-muted text-xs uppercase tracking-wide">Cap/Shift</th>
                  <th class="px-3 py-2 text-right font-semibold text-muted text-xs uppercase tracking-wide">Util %</th>
                  <th class="px-3 py-2 text-center font-semibold text-muted text-xs uppercase tracking-wide">Status</th>
                  <th v-if="isEditable" class="px-3 py-2 text-center font-semibold text-muted text-xs uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr
                  v-for="sched in order.schedules" :key="sched.id"
                  class="hover:bg-elevated/50 transition-colors"
                  :class="{ 'bg-amber-50 dark:bg-amber-950/20': isWeekend(sched.production_date) }"
                >
                  <td class="px-3 py-2 text-muted text-xs font-mono">{{ sched.sequence }}</td>
                  <td class="px-3 py-2 font-mono text-xs">
                    {{ sched.part?.part_number ?? '—' }}
                    <span class="text-muted block">{{ sched.part?.part_name ?? '' }}</span>
                  </td>
                  <td class="px-3 py-2 text-xs">{{ sched.line?.name ?? sched.line_name_snapshot ?? '—' }}</td>
                  <td class="px-3 py-2 text-xs">
                    {{ sched.shift?.name ?? sched.shift_name_snapshot ?? '—' }}
                    <span v-if="sched.shift" class="text-muted block font-mono text-xs">{{ sched.shift.start_time }}–{{ sched.shift.end_time }}</span>
                  </td>
                  <td class="px-3 py-2 font-mono text-xs" :class="isWeekend(sched.production_date) ? 'text-warning-600 dark:text-warning-400' : ''">{{ fmtDate(sched.production_date) }}</td>
                  <td class="px-3 py-2 text-right font-mono text-xs">{{ fmtNum(sched.planned_qty_per_day) }}</td>
                  <td class="px-3 py-2 text-right font-mono text-xs">{{ fmtNum(sched.actual_qty_per_day) }}</td>
                  <td class="px-3 py-2 text-right font-mono text-xs text-muted">{{ sched.line_capacity_per_day != null ? fmtNum(sched.line_capacity_per_day) : '—' }}</td>
                  <td class="px-3 py-2 text-right font-mono text-xs" :class="utilClass(sched.utilization_pct)">{{ sched.utilization_pct != null ? `${sched.utilization_pct}%` : '—' }}</td>
                  <td class="px-3 py-2 text-center">
                    <component :is="UBadge" :label="sched.status.replace('_', ' ')" :color="schedBadgeColor(sched.status)" variant="subtle" size="sm" />
                  </td>
                  <td v-if="isEditable" class="px-3 py-2 text-center">
                    <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" @click="openEditSchedule(sched)" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>

      <!-- TAB: Gantt Chart -->
      <div v-show="activeTab === 'gantt'">
        <div v-if="!hasSchedule" class="flex flex-col items-center justify-center py-16 text-muted gap-2">
          <UIcon name="i-lucide-gantt-chart-square" class="size-12 opacity-40" />
          <p class="text-sm">Generate a schedule first to view the Gantt chart.</p>
        </div>
        <div v-else class="overflow-x-auto rounded-lg border border-default">
          <table class="text-xs min-w-max">
            <thead class="bg-elevated sticky top-0 z-10">
              <tr>
                <th class="px-3 py-2 text-left font-semibold text-muted uppercase tracking-wide sticky left-0 bg-elevated z-20 min-w-[180px]">Product / Part</th>
                <th
                  v-for="date in ganttDates" :key="date"
                  class="px-1 py-2 text-center font-semibold text-muted min-w-[72px]"
                  :class="isWeekend(date) ? 'bg-amber-50 dark:bg-amber-950/30 text-warning-600' : ''"
                >
                  <div>{{ new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }}</div>
                  <div class="text-muted/60 font-normal">{{ new Date(date).toLocaleDateString('en-GB', { weekday: 'short' }) }}</div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="{ product, schedsByDate } in ganttRows" :key="product.id" class="hover:bg-elevated/40 transition-colors">
                <td class="px-3 py-2 sticky left-0 bg-default z-10 border-r border-default">
                  <div class="font-mono font-semibold">{{ product.part?.part_number }}</div>
                  <div class="text-muted truncate max-w-[160px]">{{ product.part?.part_name }}</div>
                  <div class="text-muted/60">{{ product.customer?.name }}</div>
                </td>
                <td
                  v-for="date in ganttDates" :key="date"
                  class="px-1 py-1 text-center align-top"
                  :class="isWeekend(date) ? 'bg-amber-50 dark:bg-amber-950/20' : ''"
                >
                  <template v-if="schedsByDate[date]?.length">
                    <div
                      v-for="sched in schedsByDate[date]" :key="sched.id"
                      class="rounded px-1 py-0.5 text-xs font-mono font-semibold mb-0.5"
                      :class="sched.utilization_pct != null && sched.utilization_pct > 100
                        ? 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300'
                        : 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'"
                      :title="`${sched.shift?.name ?? sched.shift_name_snapshot ?? 'Shift'} | Qty: ${sched.planned_qty_per_day} | Util: ${sched.utilization_pct ?? '—'}%`"
                    >
                      {{ fmtNum(sched.planned_qty_per_day) }}
                      <span class="block text-[10px] opacity-70 font-normal">{{ sched.shift?.name ?? sched.shift_name_snapshot ?? '' }}</span>
                    </div>
                  </template>
                  <span v-else class="text-muted/30">·</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="flex items-center gap-4 px-4 py-2 border-t border-default text-xs text-muted bg-elevated">
            <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded bg-primary-200 dark:bg-primary-900/60"></div>Normal utilization</div>
            <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded bg-error-200 dark:bg-error-900/60"></div>Over capacity (&gt;100%)</div>
            <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/40"></div>Weekend</div>
          </div>
        </div>
      </div>

      <!-- TAB: Resource Allocation -->
      <div v-show="activeTab === 'resource'">
        <div v-if="!hasSchedule || !resourceRows.length" class="flex flex-col items-center justify-center py-16 text-muted gap-2">
          <UIcon name="i-lucide-bar-chart-2" class="size-12 opacity-40" />
          <p class="text-sm">No resource data available yet.</p>
        </div>
        <div v-else class="overflow-x-auto rounded-lg border border-default">
          <table class="text-xs min-w-max">
            <thead class="bg-elevated">
              <tr>
                <th class="px-3 py-2 text-left font-semibold text-muted uppercase tracking-wide sticky left-0 bg-elevated z-10 min-w-[160px]">Line</th>
                <th
                  v-for="date in ganttDates" :key="date"
                  class="px-2 py-2 text-center font-semibold text-muted min-w-[80px]"
                  :class="isWeekend(date) ? 'bg-amber-50 dark:bg-amber-950/30' : ''"
                >
                  {{ new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="row in resourceRows" :key="row.lineName" class="hover:bg-elevated/40 transition-colors">
                <td class="px-3 py-2 font-semibold sticky left-0 bg-default z-10 border-r border-default">{{ row.lineName }}</td>
                <td
                  v-for="date in ganttDates" :key="date"
                  class="px-2 py-1 text-center align-top"
                  :class="isWeekend(date) ? 'bg-amber-50 dark:bg-amber-950/20' : ''"
                >
                  <template v-if="row.byDate[date]">
                    <div :class="utilClass(row.byDate[date].dailyPct)" class="font-mono font-semibold">
                      {{ row.byDate[date].dailyPct != null ? `${row.byDate[date].dailyPct}%` : '—' }}
                    </div>
                    <div class="text-muted/60 font-mono">{{ fmtNum(row.byDate[date].totalQty) }}</div>
                    <div
                      v-for="sh in row.byDate[date].shifts" :key="sh.shiftName"
                      class="text-muted/50 font-mono mt-0.5"
                      :title="`${sh.shiftName}: ${sh.qty} / ${sh.capacity} (${sh.pct ?? '—'}%)`"
                    >
                      <span :class="utilClass(sh.pct)" class="text-[10px]">{{ sh.shiftName }}: {{ sh.pct != null ? `${sh.pct}%` : '—' }}</span>
                    </div>
                  </template>
                  <span v-else class="text-muted/30">·</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB: Reschedule Logs -->
      <div v-show="activeTab === 'logs'">
        <div v-if="!order.reschedule_logs?.length" class="flex flex-col items-center justify-center py-16 text-muted gap-2">
          <UIcon name="i-lucide-history" class="size-12 opacity-40" />
          <p class="text-sm">No reschedule history found.</p>
        </div>
        <div v-else class="overflow-x-auto rounded-lg border border-default">
          <table class="w-full text-sm">
            <thead class="bg-elevated">
              <tr>
                <th class="px-3 py-2 text-left font-semibold text-muted text-xs uppercase tracking-wide">#</th>
                <th class="px-3 py-2 text-left font-semibold text-muted text-xs uppercase tracking-wide">Old Range</th>
                <th class="px-3 py-2 text-left font-semibold text-muted text-xs uppercase tracking-wide">New Range</th>
                <th class="px-3 py-2 text-left font-semibold text-muted text-xs uppercase tracking-wide">Reason</th>
                <th class="px-3 py-2 text-right font-semibold text-muted text-xs uppercase tracking-wide">Impacted WOs</th>
                <th class="px-3 py-2 text-left font-semibold text-muted text-xs uppercase tracking-wide">Rescheduled At</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="(log, idx) in order.reschedule_logs" :key="log.id" class="hover:bg-elevated/50">
                <td class="px-3 py-2 text-muted text-xs">{{ idx + 1 }}</td>
                <td class="px-3 py-2 font-mono text-xs">{{ fmtDate(log.old_start_date) }} – {{ fmtDate(log.old_end_date) }}</td>
                <td class="px-3 py-2 font-mono text-xs">{{ fmtDate(log.new_start_date) }} – {{ fmtDate(log.new_end_date) }}</td>
                <td class="px-3 py-2 text-xs max-w-xs">{{ log.reschedule_reason }}</td>
                <td class="px-3 py-2 text-right font-mono text-xs">{{ log.impacted_wo_count }}</td>
                <td class="px-3 py-2 font-mono text-xs">{{ fmtDate(log.rescheduled_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Modals & Dialogs -->
    <ConfirmDialog v-model:open="submitConfirm.open" :title="submitConfirm.title" :description="submitConfirm.description" confirm-label="Submit" :loading="saving" @confirm="handleSubmit" />
    <ConfirmDialog v-model:open="releaseConfirm.open" :title="releaseConfirm.title" :description="releaseConfirm.description" confirm-label="Confirm Release" :loading="saving" @confirm="handleRelease" />
    <OrderScheduleEditModal v-model:open="editModal.open" :schedule="editModal.schedule" :loading="saving" @save="handleSaveSchedule" />
    <OrderScheduleApproveModal v-model:open="approveModal" :loading="saving" @confirm="handleApprove" />
    <OrderScheduleRejectModal v-model:open="rejectModal" :loading="saving" @confirm="handleReject" />
    <OrderScheduleRescheduleModal
      v-model:open="rescheduleModal"
      :current-start="order?.production_start_date"
      :current-end="order?.production_end_date"
      :latest-delivery-date="order?.latest_delivery_date ?? undefined"
      :loading="saving"
      @confirm="handleReschedule"
    />
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>