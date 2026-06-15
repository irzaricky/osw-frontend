<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProductionPlanStore } from '../../../stores/production-plan/plan.store'
import { useAppToast } from '../../../composables/useAppToast'
import type { PlanStatus, OverallStatus, PlanType } from '../../../types/production-plan/plan'
import lineService from '../../../services/master-data/line.service'
import lineCapacityService from '../../../services/master-data/line-capacity.service'

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
const { currentPlan, availableDOs, dropdown, loading, saving, calculating } = storeToRefs(planStore)
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

const selectedDOs  = ref<number[]>([])
const showDOModal  = ref(false)

const selectedDOItems = computed(() =>
  availableDOs.value.filter((d) => selectedDOs.value.includes(d.id)),
)

function toggleDO(id: number) {
  const idx = selectedDOs.value.indexOf(id)
  if (idx === -1) selectedDOs.value.push(id)
  else selectedDOs.value.splice(idx, 1)
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
    }
    else {
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
    if (!isCreate.value || !newMonth) return
    if (headerForm.plan_type !== 'ORIGINAL') return
    selectedDOs.value = []
    planStore.fetchAvailableDOs(newMonth)
  },
)

// ── Capacity state ─────────────────────────────────────────────────────────

const lines          = ref<any[]>([])
const selectedLineId = ref<number | undefined>(undefined)
const lineParams     = ref<any>(null)
const loadingParams  = ref(false)

const editParamForm = reactive({
  working_days:            0,
  shifts_per_day:          0,
  working_hours_per_shift: 0,
  manpower:                0,
  efficiency_factor:       0,
  overtime_hours:          0,
  max_takt_time:           0,
})

async function fetchLineParams(lineId: number) {
  loadingParams.value = true
  lineParams.value    = null
  try {
    const res        = await lineCapacityService.getParams(lineId)
    lineParams.value = res.data?.data ?? null
  }
  catch (e) {
    toastError(e)
  }
  finally {
    loadingParams.value = false
  }
}

watch(selectedLineId, (id) => {
  if (id) {
    fetchLineParams(id)
    syncEditParamForm(id)
  }
  else {
    lineParams.value = null
  }
})

function syncEditParamForm(lineId: number) {
  const param = currentPlan.value?.capacity_params?.find((p: any) => p.line_id === lineId)
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

const confirm = reactive({
  open:         false,
  title:        '',
  description:  '',
  confirmLabel: 'Confirm',
  action:       null as (() => Promise<void>) | null,
})

const reject = reactive({
  open:        false,
  title:       'Reject Production Plan',
  description: 'Please provide a reason for rejection.',
})

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

const hasImpossible = computed(() =>
  currentPlan.value?.details?.some((d: any) => d.status === 'IMPOSSIBLE'),
)

const hasUnrouted = computed(() =>
  currentPlan.value?.details?.some((d: any) => !d.assigned_line_id),
)

function fmtDate(d?: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtNum(n?: number | null) {
  if (n == null) return '-'
  return n.toLocaleString('en-US')
}

// ── CRUD Actions ──────────────────────────────────────────────────────────

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
      if (res.data?.warning) {
        toastError(res.data.warning)
      }
      toastSuccess(res.message || 'Plan created successfully')
      await nextTick()
      router.push({ name: 'production-plan-detail-edit', params: { id: res.data.id } })
    }
    else if (planId.value) {
      await planStore.updatePlan(planId.value, {
        plan_description: headerForm.plan_description || null,
        notes:            headerForm.notes || null,
      })

      const currentDoIds = currentPlan.value?.details
        ? [...new Set((currentPlan.value.details as any[]).map((d) => d.do_id))]
        : []
      const added   = selectedDOs.value.filter((id) => !currentDoIds.includes(id))
      const removed = currentDoIds.filter((id: number) => !selectedDOs.value.includes(id))

      if (added.length > 0 || removed.length > 0) {
        await planStore.syncDOs(planId.value, { do_ids: selectedDOs.value })
        await planStore.fetchPlan(planId.value)
        selectedDOs.value = currentPlan.value?.details
          ? [...new Set((currentPlan.value.details as any[]).map((d) => d.do_id))]
          : []
      }
      confirm.open = false
      toastSuccess('Plan updated successfully')
    }
  }
  catch (e) { toastError(e) }
}

async function handleSaveBase() {
  if (!planId.value || !selectedLineId.value) {
    toastError('Please select a production line first.')
    return
  }
  try {
    const res = await planStore.saveCapacityParams(planId.value, { line_id: selectedLineId.value })
    toastSuccess(res.message || 'BASE parameters saved from line master')
    syncEditParamForm(selectedLineId.value)
  }
  catch (e) { toastError(e) }
}

async function handleSaveParamEdit() {
  if (!planId.value || !selectedLineId.value) {
    toastError('Please select a production line first.')
    return
  }
  try {
    const res = await planStore.updateCapacityParams(planId.value, {
      line_id:                 selectedLineId.value,
      working_days:            editParamForm.working_days,
      shifts_per_day:          editParamForm.shifts_per_day,
      working_hours_per_shift: editParamForm.working_hours_per_shift,
      manpower:                editParamForm.manpower,
      efficiency_factor:       editParamForm.efficiency_factor,
      overtime_hours:          editParamForm.overtime_hours,
      max_takt_time:           editParamForm.max_takt_time,
    })
    toastSuccess(res.message || 'Parameters updated. Run Calculate to apply.')
  }
  catch (e) { toastError(e) }
}

async function handleCalculate() {
  if (!planId.value || !selectedLineId.value) {
    toastError('Please select a production line first.')
    return
  }
  try {
    await planStore.calculateCapacity(planId.value, { line_id: selectedLineId.value })
    confirm.open = false
    toastSuccess('Capacity calculation completed successfully')
  }
  catch (e) { toastError(e) }
}

const calculatingAll = ref(false)

async function handleCalculateAll() {
  if (!planId.value) return
  const params = currentPlan.value?.capacity_params ?? []
  if (params.length === 0) {
    toastError('No lines with parameters to calculate.')
    return
  }
  calculatingAll.value = true
  confirm.open = false
  try {
    await planStore.calculateAllCapacity(planId.value)
    await planStore.fetchPlan(planId.value)
    toastSuccess('All lines calculated successfully.')
  }
  catch (e) {
    toastError(e)
  }
  finally {
    calculatingAll.value = false
  }
}

// ── Approval Workflow ──────────────────────────────────────────────────────

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

function openRejectConfirm() { reject.open = true }

async function handleReject(reason: string) {
  try {
    if (!planId.value) return
    const res = await planStore.reject(planId.value, { rejection_reason: reason })
    toastSuccess(res.message || 'Plan rejected successfully')
    reject.open = false
  }
  catch (e) { toastError(e) }
}

function openConfirm(options: { title: string; description: string; action: () => Promise<void> }) {
  confirm.title        = options.title
  confirm.description  = options.description
  confirm.action       = options.action
  confirm.open         = true
}

const canSubmit = computed(() =>
  isEditable.value &&
  currentPlan.value?.status === 'Draft' &&
  currentPlan.value?.overall_status !== 'Not_Calculated' &&
  !hasImpossible.value &&
  !hasUnrouted.value,
)

// ── Lifecycle ──────────────────────────────────────────────────────────────

watch(
  () => route.params.id,
  async (newId) => {
    if (!newId) return
    const id = Number(newId)

    if (isCreate.value) {
      planStore.clearCurrentPlan()
      headerForm.plan_month       = ''
      headerForm.plan_type        = 'ORIGINAL'
      headerForm.parent_plan_id   = null
      headerForm.plan_description = ''
      headerForm.notes            = ''
      selectedDOs.value           = []
    }
    else if (planId.value) {
      const lineRes = await lineService.getDropdown()
      lines.value = lineRes.data?.data ?? []

      planStore.clearCurrentPlan()
      await planStore.fetchPlan(id)

      if (currentPlan.value?.plan_month) {
        await planStore.fetchAvailableDOs(currentPlan.value.plan_month)
      }

      if (currentPlan.value?.details) {
        selectedDOs.value = [...new Set((currentPlan.value.details as any[]).map((d) => d.do_id))]
      }

      if (currentPlan.value) {
        headerForm.plan_description = currentPlan.value.plan_description ?? ''
        headerForm.notes            = currentPlan.value.notes ?? ''

        const firstParam = currentPlan.value.capacity_params?.[0]
        if (firstParam) {
          selectedLineId.value = firstParam.line_id
        }
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <UDashboardPanel id="planning-form">
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
                @click="openRejectConfirm"
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
          title="Status Overall: IMPOSSIBLE"
          description="Capacity is insufficient to meet all requests. Edit parameters in the Capacity tab and recalculate."
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
          :title="`Rejected by ${currentPlan.rejected_by ?? 'Supervisor'}`"
          :description="currentPlan.rejection_reason"
        />

        <!-- SECTION 1: PLAN INFORMATION -->
        <PlanInfoCard
          :is-create="isCreate"
          :is-detail="isEditable"
          :current-plan="currentPlan"
          :pending-dos="selectedDOItems"
          :do-references="[]"
          :header-form="headerForm"
          :saving="saving"
          :fmt-date="fmtDate"
          :fmt-num="fmtNum"
          :approved-original-plans="approvedOriginalPlans"
          @open-do-modal="showDOModal = true"
          @remove-pending="toggleDO"
          @remove-do="toggleDO"
        />

        <!-- SECTION 2: DELIVERY ORDERS (create mode) -->
        <PlanDOSection
          v-if="isCreate"
          :selected-do-items="selectedDOItems"
          :selected-do-ids="selectedDOs"
          :fmt-date="fmtDate"
          @open-modal="showDOModal = true"
          @remove="toggleDO"
        />

        <!-- SECTION 3: TABS (detail/edit mode) -->
        <PlanTabsSection
          v-if="!isCreate"
          :current-plan="currentPlan"
          :selected-line-id="selectedLineId"
          :lines="lines"
          :line-params="lineParams"
          :loading-params="loadingParams"
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
          @update:selected-line-id="selectedLineId = $event"
          @save-base="handleSaveBase"
          @save-param-edit="handleSaveParamEdit"
          @calculate="openConfirm({
            title: 'Recalculate Capacity',
            description: 'Capacity will be recalculated for this line. Do you want to proceed?',
            action: handleCalculate,
          })"
          @calculate-all="openConfirm({
            title: 'Recalculate All Lines',
            description: 'All lines will be recalculated. This may take some time. Do you want to proceed?',
            action: handleCalculateAll,
          })"
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
          v-model:open="reject.open"
          :title="reject.title"
          :description="reject.description"
          :loading="saving"
          required
          @confirm="handleReject"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>