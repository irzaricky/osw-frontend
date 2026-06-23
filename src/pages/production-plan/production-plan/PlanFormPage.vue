<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProductionPlanStore } from '../../../stores/production-plan/plan.store'
import { useAppToast } from '../../../composables/useAppToast'
import type { PlanStatus, OverallStatus, PlanType } from '../../../types/production-plan/plan'

import Breadcrumbs    from '../../../components/Breadcrumbs.vue'
import PlanInfoCard   from './components/PlanInfoCard.vue'
import PlanDOSection  from './components/PlanDOSection.vue'
import PlanTabsSection from './components/PlanTabsSection.vue'
import PlanDOModal    from './components/PlanDOModal.vue'
import ConfirmDialog  from '../../../components/ConfirmDialog.vue'
import RejectDialog   from '../../../components/RejectDialog.vue'

const router    = useRouter()
const route     = useRoute()
const planStore = useProductionPlanStore()
const { currentPlan, availableDOs, dropdown, calendarPreview, loading, saving, calculating } = storeToRefs(planStore)
const { toastSuccess, toastError } = useAppToast()

const isCreate   = computed(() => route.name === 'production-plan-create')
const isEditable = computed(() =>
  !isCreate.value &&
  (currentPlan.value?.status === 'Draft' || currentPlan.value?.status === 'Rejected'),
)
const planId = computed(() => route.params.id ? Number(route.params.id) : null)

const breadcrumbItems = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Production Plan' },
  { label: 'Planning', to: '/production-plan/plan' },
  { label: isCreate.value ? 'Create New Plan' : 'Plan Details' },
])

const headerForm = reactive({
  plan_month:       '',
  plan_type:        'ORIGINAL' as PlanType,
  parent_plan_id:   null as number | null,
  plan_description: '',
  notes:            '',
})

const planTabsSectionRef = ref<{ goToDetails: () => void } | null>(null)
const selectedDOs = ref<number[]>([])
const showDOModal = ref(false)

const selectedDOItems = computed(() =>
  availableDOs.value.filter((d) => selectedDOs.value.includes(d.id)),
)

function toggleDO(id: number) {
  const idx = selectedDOs.value.indexOf(id)
  if (idx === -1) selectedDOs.value.push(id)
  else selectedDOs.value.splice(idx, 1)
}

const planInfoCardRef = ref<{ resetPendingRemove: () => void } | null>(null)

// Hapus DO baru yang belum tersimpan (pending)
function removePendingDO(id: number) {
  const idx = selectedDOs.value.indexOf(id)
  if (idx !== -1) selectedDOs.value.splice(idx, 1)
}
const pendingRemoveDoIds = ref<Set<number>>(new Set())

function removeExistingDO(id: number) {
  pendingRemoveDoIds.value = new Set([...pendingRemoveDoIds.value, id])
}

function undoRemoveDO(id: number) {
  const next = new Set(pendingRemoveDoIds.value)
  next.delete(id)
  pendingRemoveDoIds.value = next
}

function handleSelectAll(ids: number[], select: boolean) {
  if (select) selectedDOs.value = [...new Set([...selectedDOs.value, ...ids])]
  else selectedDOs.value = selectedDOs.value.filter((id) => !ids.includes(id))
}

const approvedOriginalPlans = computed(() =>
  (dropdown.value as any[])
    .filter((p) => p.plan_type === 'ORIGINAL')
    .map((p) => ({
      id:          p.id as number,
      plan_number: p.plan_number as string,
      plan_month:  p.plan_month as string,
    }))
)

watch(
  () => headerForm.plan_type,
  (type) => {
    if (type === 'AMENDMENT') {
      planStore.fetchDropdown()
      headerForm.plan_month     = ''
      headerForm.parent_plan_id = null
    } else {
      headerForm.parent_plan_id = null
    }
    selectedDOs.value = []
  },
)

watch(
  () => headerForm.parent_plan_id,
  (parentId) => {
    if (!parentId || headerForm.plan_type !== 'AMENDMENT') return
    const parent = approvedOriginalPlans.value.find((p) => p.id === parentId)
    if (parent) {
      headerForm.plan_month = parent.plan_month
      selectedDOs.value     = []
      planStore.fetchAvailableDOs(parent.plan_month)
    }
  },
)

watch(
  () => headerForm.plan_month,
  (newMonth) => {
    if (!isCreate.value || !newMonth || headerForm.plan_type !== 'ORIGINAL') return
    selectedDOs.value = []
    planStore.fetchAvailableDOs(newMonth)
  },
)

// ── Capacity param edit form ───────────────────────────────────────────────

const editParamForm = reactive({
  working_days:            0,
  shifts_per_day:          0,
  working_hours_per_shift: 0,
  manpower:                0,
  efficiency_factor:       0,
  overtime_hours:          0,
  max_takt_time:           0,
})

function syncEditParamForm() {
  const param = currentPlan.value?.capacity_params?.[0]
  if (param) {
    editParamForm.working_days            = param.working_days
    editParamForm.shifts_per_day          = param.shifts_per_day
    editParamForm.working_hours_per_shift = Number(param.working_hours_per_shift)
    editParamForm.manpower                = param.manpower
    editParamForm.efficiency_factor       = Number(param.efficiency_factor)
    editParamForm.overtime_hours          = Number(param.overtime_hours)
    editParamForm.max_takt_time           = param.max_takt_time
  }
}

// ── Dialogs ────────────────────────────────────────────────────────────────

const confirm = reactive({
  open:         false,
  title:        '',
  description:  '',
  confirmLabel: 'Confirm',
  action:       null as (() => Promise<void>) | null,
})

const rejectDialog = reactive({
  open:        false,
  title:       'Reject Production Plan',
  description: 'Please provide a reason for rejection.',
})

// ── Status display maps ────────────────────────────────────────────────────

const planStatusLabel: Record<PlanStatus, string> = {
  Draft:            'Draft',
  Pending_Approval: 'Pending Approval',
  Approved:         'Approved',
  Rejected:         'Rejected',
}
const planStatusColor: Record<PlanStatus, 'neutral' | 'warning' | 'success' | 'error'> = {
  Draft:            'neutral',
  Pending_Approval: 'warning',
  Approved:         'success',
  Rejected:         'error',
}
const overallStatusLabel: Record<OverallStatus, string> = {
  Not_Calculated: 'Not Calculated',
  POSSIBLE:       'POSSIBLE',
  IMPOSSIBLE:     'IMPOSSIBLE',
}
const overallStatusColor: Record<OverallStatus, 'neutral' | 'success' | 'error'> = {
  Not_Calculated: 'neutral',
  POSSIBLE:       'success',
  IMPOSSIBLE:     'error',
}
const detailStatusColor = (s?: string | null) => {
  if (s === 'POSSIBLE')   return 'success'
  if (s === 'IMPOSSIBLE') return 'error'
  return 'neutral'
}

// ── Derived state ──────────────────────────────────────────────────────────

const hasUnrouted = computed(() =>
  currentPlan.value?.details?.some((d: any) => !d.assigned_line_id),
)

// Submit requires: capacity calculated (not Not_Calculated) + all details have routing
// IMPOSSIBLE is allowed to submit — supervisor reviews it
const canSubmit = computed(() =>
  isEditable.value &&
  currentPlan.value?.status === 'Draft' &&
  currentPlan.value?.overall_status !== 'Not_Calculated' &&
  !hasUnrouted.value,
)

// ── Formatters ─────────────────────────────────────────────────────────────

function fmtDate(d?: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtNum(n?: number | null) {
  if (n == null) return '-'
  return n.toLocaleString('en-US')
}

// ── CRUD actions ───────────────────────────────────────────────────────────

async function handleSaveHeader() {
  try {
    if (isCreate.value) {
      if (!headerForm.plan_month) {
        toastError('Please select a plan month first.')
        return
      }
      if (selectedDOs.value.length === 0) {
        toastError('Select at least one Delivery Order.')
        return
      }
      if (headerForm.plan_type === 'AMENDMENT' && !headerForm.parent_plan_id) {
        toastError('Please select a parent plan for Amendment.')
        return
      }

      const res = await planStore.createPlan({
        plan_month:       headerForm.plan_month,
        plan_type:        headerForm.plan_type,
        parent_plan_id:   headerForm.plan_type === 'AMENDMENT'
                            ? (headerForm.parent_plan_id ?? undefined)
                            : undefined,
        plan_description: headerForm.plan_description || null,
        do_ids:           selectedDOs.value,
        notes:            headerForm.notes || null,
      })
      if (res.data?.warning) toastError(res.data.warning)
      if (res.data?.line_conflicts?.length) {
        toastError(`Warning: ${res.data.line_conflicts.length} line conflict(s) detected with other active plans.`)
      }
      toastSuccess(res.message || 'Plan created successfully')
      await nextTick()
      router.push({ name: 'production-plan-detail-edit', params: { id: res.data.id } })
    } else if (planId.value) {
      await planStore.updatePlan(planId.value, {
        plan_description: headerForm.plan_description || null,
        notes:            headerForm.notes || null,
      })

      const doChanged = (
        selectedDOs.value.filter(id => id > 0).length > 0 ||
        pendingRemoveDoIds.value.size > 0
      )

      if (doChanged) {
        const existingDoIds: number[] = currentPlan.value?.details
          ? [...new Set((currentPlan.value.details as any[]).map((d: any) => d.do_id))]
          : []

        const cleanDoIds = [
          // Existing DO yang tidak di-mark untuk remove
          ...existingDoIds.filter((id) => !pendingRemoveDoIds.value.has(id)),
          // Pending DO baru yang dipilih user (positif saja)
          ...selectedDOs.value.filter((id) => id > 0 && !existingDoIds.includes(id)),
        ]

        await planStore.syncDOs(planId.value, { do_ids: cleanDoIds })

        selectedDOs.value        = []
        pendingRemoveDoIds.value = new Set()
        planInfoCardRef.value?.resetPendingRemove()

        await planStore.fetchPlan(planId.value)
        if (currentPlan.value?.plan_month) {
          await planStore.fetchAvailableDOs(currentPlan.value.plan_month)
        }

        selectedDOs.value = currentPlan.value?.details
          ? [...new Set((currentPlan.value.details as any[]).map((d: any) => d.do_id))]
          : []
      }
      confirm.open = false
      toastSuccess('Plan updated successfully')
    }
  }
  catch (e) { toastError(e) }
}

async function handleSaveParamEdit() {
  if (!planId.value) return
  const param = currentPlan.value?.capacity_params?.[0]
  if (!param) {
    toastError('No capacity parameters found for this plan.')
    return
  }
  try {
    const res = await planStore.updateCapacityParams(planId.value, {
      line_id:                 param.line_id,
      // working_days:            editParamForm.working_days,
      // shifts_per_day:          editParamForm.shifts_per_day,
      // working_hours_per_shift: editParamForm.working_hours_per_shift,
      manpower:                editParamForm.manpower,
      efficiency_factor:       editParamForm.efficiency_factor,
      // overtime_hours:          editParamForm.overtime_hours,
      // max_takt_time:           editParamForm.max_takt_time,
    })
    toastSuccess(res.message || 'Parameters updated. Run Calculate to apply.')
  }
  catch (e) { toastError(e) }
}

async function handleCalculate() {
  if (!planId.value) return
  const param = currentPlan.value?.capacity_params?.[0]
  if (!param) {
    toastError('No capacity parameters found for this plan.')
    return
  }
  try {
    await planStore.calculateCapacity(planId.value, { line_id: param.line_id })
    confirm.open = false
    toastSuccess('Capacity calculation completed successfully')
    planTabsSectionRef.value?.goToDetails()
  }
  catch (e) { toastError(e) }
}

const calculatingAll = ref(false)

async function handleCalculateAll() {
  if (!planId.value) return
  const params = currentPlan.value?.capacity_params ?? []
  if (params.length === 0) {
    toastError('No capacity parameters found to calculate.')
    return
  }
  calculatingAll.value = true
  confirm.open = false
  try {
    await planStore.calculateAllCapacity(planId.value)
    toastSuccess('Capacity calculated successfully.')
    planTabsSectionRef.value?.goToDetails()
  }
  catch (e) { toastError(e) }
  finally { calculatingAll.value = false }
}

// ── Calendar adjustment actions ────────────────────────────────────────────

async function handleAddAdjustment(payload: any) {
  if (!planId.value) return
  try {
    const res = await planStore.addCalendarAdjustment(planId.value, payload)
    toastSuccess(res.message || 'Calendar adjustment added. Recalculate to apply.')
  }
  catch (e) { toastError(e) }
}

async function handleUpdateAdjustment(adjustment_id: number, payload: any) {
  if (!planId.value) return
  try {
    const res = await planStore.updateCalendarAdjustment(planId.value, adjustment_id, payload)
    toastSuccess(res.message || 'Calendar adjustment updated. Recalculate to apply.')
  }
  catch (e) { toastError(e) }
}

async function handleDeleteAdjustment(adjustment_id: number) {
  if (!planId.value) return
  try {
    const res = await planStore.deleteCalendarAdjustment(planId.value, adjustment_id)
    toastSuccess(res.message || 'Calendar adjustment removed.')
  }
  catch (e) { toastError(e) }
}

// ── Approval workflow ──────────────────────────────────────────────────────

function openSubmitConfirm() {
  confirm.title        = 'Submit for Approval'
  confirm.description  = `Plan "${currentPlan.value?.plan_number}" will be submitted for review. Once submitted, it can no longer be edited.`
  confirm.confirmLabel = 'Submit'
  confirm.action = async () => {
    try {
      if (!planId.value) return
      const res = await planStore.submitForApproval(planId.value)
      toastSuccess(res.message || 'Plan submitted successfully')
      confirm.open = false
    }
    catch (e) { toastError(e); confirm.open = false }
  }
  confirm.open = true
}

function openApproveConfirm() {
  confirm.title        = 'Approve Production Plan'
  confirm.description  = `Plan "${currentPlan.value?.plan_number}" will be approved.`
  confirm.confirmLabel = 'Approve'
  confirm.action = async () => {
    try {
      if (!planId.value) return
      const res = await planStore.approve(planId.value)
      toastSuccess(res.message || 'Plan approved successfully')
      confirm.open = false
    }
    catch (e) { toastError(e); confirm.open = false }
  }
  confirm.open = true
}

async function handleReject(reason: string) {
  try {
    if (!planId.value) return
    const res = await planStore.reject(planId.value, { rejection_reason: reason })
    toastSuccess(res.message || 'Plan rejected successfully')
    rejectDialog.open = false
  }
  catch (e) { toastError(e) }
}

function openConfirm(options: { title: string; description: string; action: () => Promise<void> }) {
  confirm.title        = options.title
  confirm.description  = options.description
  confirm.action       = options.action
  confirm.open         = true
}

// ── Lifecycle ──────────────────────────────────────────────────────────────

watch(
  () => route.params.id,
  async (newId) => {
    if (isCreate.value) {
      planStore.clearCurrentPlan()
      Object.assign(headerForm, {
        plan_month: '', plan_type: 'ORIGINAL', parent_plan_id: null,
        plan_description: '', notes: '',
      })
      selectedDOs.value = []
      return
    }

    if (!newId) return
    const id = Number(newId)

    planStore.clearCurrentPlan()
    await planStore.fetchPlan(id)
    await planStore.fetchCalendarPreview(id)

    if (currentPlan.value?.plan_month) {
      await planStore.fetchAvailableDOs(currentPlan.value.plan_month)
    }
    if (currentPlan.value?.details) {
      selectedDOs.value = [...new Set((currentPlan.value.details as any[]).map((d) => d.do_id))]
    }
    if (currentPlan.value) {
      headerForm.plan_description = currentPlan.value.plan_description ?? ''
      headerForm.notes            = currentPlan.value.notes ?? ''
      syncEditParamForm()
    }
  },
  { immediate: true },
)
</script>

<template>
  <UDashboardPanel id="plan-capacity-form">
    <template #header>
      <UDashboardNavbar title="Production Plan">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <Breadcrumbs :items="breadcrumbItems" />

        <!-- PAGE HEADER -->
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <UButton
              icon="i-lucide-arrow-left"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="router.push('/production-plan/plan')"
            />
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-2xl font-bold">
                  {{ isCreate ? 'Create Production Plan' : currentPlan?.plan_number ?? '—' }}
                </h1>
                <UBadge
                  v-if="!isCreate && currentPlan?.status"
                  :label="planStatusLabel[currentPlan.status]"
                  :color="planStatusColor[currentPlan.status]"
                  variant="subtle"
                />
                <UBadge
                  v-if="!isCreate && currentPlan?.overall_status && currentPlan.overall_status !== 'Not_Calculated'"
                  :label="overallStatusLabel[currentPlan.overall_status]"
                  :color="overallStatusColor[currentPlan.overall_status]"
                  variant="soft"
                />
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <template v-if="isCreate">
              <UButton
                label="Create Plan"
                icon="i-lucide-save"
                color="primary"
                :loading="saving"
                :disabled="selectedDOs.length === 0"
                @click="handleSaveHeader"
              />
            </template>
            <template v-else-if="isEditable">
              <UButton
                label="Save"
                icon="i-lucide-save"
                color="neutral"
                variant="soft"
                :loading="saving"
                @click="openConfirm({
                  title: 'Save Changes',
                  description: 'Do you want to save the changes to this production plan?',
                  action: handleSaveHeader,
                })"
              />
              <UButton
                v-if="currentPlan?.status === 'Draft'"
                label="Submit for Approval"
                icon="i-lucide-send"
                color="primary"
                :loading="saving"
                :disabled="!canSubmit"
                @click="openSubmitConfirm"
              />
            </template>
            <template v-else>
              <UButton
                v-if="currentPlan?.status === 'Pending_Approval'"
                label="Approve"
                icon="i-lucide-check"
                color="success"
                :loading="saving"
                @click="openApproveConfirm"
              />
              <UButton
                v-if="currentPlan?.status === 'Pending_Approval'"
                label="Reject"
                icon="i-lucide-x"
                color="error"
                variant="soft"
                :loading="saving"
                @click="rejectDialog.open = true"
              />
            </template>
          </div>
        </div>

        <!-- ALERTS -->
        <UAlert
          v-if="!isCreate && currentPlan?.overall_status === 'IMPOSSIBLE'"
          color="error"
          variant="soft"
          icon="i-lucide-alert-triangle"
          title="Capacity Status: IMPOSSIBLE"
          description="Capacity is insufficient to meet all requests. Add Calendar Adjustments or edit parameters, then recalculate."
        />
        <UAlert
          v-if="!isCreate && hasUnrouted && isEditable"
          color="warning"
          variant="soft"
          icon="i-lucide-alert-circle"
          title="Products Without Routing"
          description="Some products have no active routing configured. Capacity cannot be calculated for those products. Please set up part routing first."
        />
        <UAlert
          v-if="!isCreate && currentPlan?.status === 'Rejected' && currentPlan.rejection_reason"
          color="error"
          variant="soft"
          icon="i-lucide-x-circle"
          :title="`Rejected: ${currentPlan.rejection_reason}`"
        />

        <!-- PLAN INFO CARD -->
        <PlanInfoCard
          ref="planInfoCardRef"
          :is-create="isCreate"
          :is-detail="isEditable"
          :current-plan="currentPlan"
          :pending-dos="selectedDOItems"
          :header-form="headerForm"
          :saving="saving"
          :fmt-date="fmtDate"
          :fmt-num="fmtNum"
          :approved-original-plans="approvedOriginalPlans"
          @open-do-modal="showDOModal = true"
          @remove-pending="removePendingDO"
          @remove-do="removeExistingDO"
          @undo-remove-do="undoRemoveDO"
        />

        <!-- DELIVERY ORDERS (create mode) -->
        <PlanDOSection
          v-if="isCreate"
          :selected-do-items="selectedDOItems"
          :selected-do-ids="selectedDOs"
          :fmt-date="fmtDate"
          @open-modal="showDOModal = true"
          @remove="toggleDO"
        />

        <!-- TABS (detail / edit mode) -->
        <PlanTabsSection
          ref="planTabsSectionRef"
          v-if="!isCreate"
          :current-plan="currentPlan"
          :calendar-preview="calendarPreview"
          :edit-param-form="editParamForm"
          :loading="loading"
          :saving="saving"
          :calculating="calculating"
          :calculating-all="calculatingAll"
          :is-editable="isEditable"
          :plan-id="planId"
          :fmt-date="fmtDate"
          :fmt-num="fmtNum"
          :overall-status-label="overallStatusLabel"
          :overall-status-color="overallStatusColor"
          :detail-status-color="detailStatusColor"
          @save-param-edit="handleSaveParamEdit"
          @calculate="openConfirm({
            title: 'Recalculate Capacity',
            description: 'Capacity will be recalculated based on current parameters and calendar adjustments. Proceed?',
            action: handleCalculate,
          })"
          @calculate-all="openConfirm({
            title: 'Recalculate Capacity',
            description: 'Capacity will be recalculated based on current parameters and calendar adjustments. Proceed?',
            action: handleCalculateAll,
          })"
          @add-adjustment="handleAddAdjustment"
          @update-adjustment="handleUpdateAdjustment"
          @delete-adjustment="handleDeleteAdjustment"
        />

        <PlanDOModal
          v-model:open="showDOModal"
          :available-dos="availableDOs"
          :selected-do-ids="selectedDOs"
          :loading="loading"
          :fmt-date="fmtDate"
          @toggle="toggleDO"
          @select-all="handleSelectAll"
        />

        <ConfirmDialog
          v-model:open="confirm.open"
          :title="confirm.title"
          :description="confirm.description"
          :confirm-label="confirm.confirmLabel"
          :loading="saving"
          @confirm="confirm.action?.()"
        />

        <RejectDialog
          v-model:open="rejectDialog.open"
          :title="rejectDialog.title"
          :description="rejectDialog.description"
          :loading="saving"
          required
          @confirm="handleReject"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>