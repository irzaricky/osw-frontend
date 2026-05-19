<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProductionPlanStore } from '../../../stores/production-plan/plan.store'
import { useAppToast } from '../../../composables/useAppToast'
import type { PlanStatus, OverallStatus, AdjustmentType } from '../../../types/production-plan/plan'
import lineService from '../../../services/master-data/line.service'
import lineCapacityService from '../../../services/master-data/line-capacity.service'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import PlanInfoCard from './components/PlanInfoCard.vue'
import PlanDOSection from './components/PlanDOSection.vue'
import PlanTabsSection from './components/PlanTabsSection.vue'
import PlanDOModal from './components/PlanDOModal.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import RejectDialog from '../../../components/RejectDialog.vue'

// Router & Store
const router  = useRouter()
const route   = useRoute()
const planStore = useProductionPlanStore()
const { currentPlan, availableDOs, loading, saving, calculating } = storeToRefs(planStore)
const { toastSuccess, toastError } = useAppToast()

// Mode Detection
const isCreate   = computed(() => route.name === 'production-plan-create')
const isEditable = computed(() =>
  !isCreate.value &&
  (currentPlan.value?.status === 'Draft' || currentPlan.value?.status === 'Rejected'),
)
const planId = computed(() => route.params.id ? Number(route.params.id) : null)

// Breadcrumbs
const breadcrumbItems = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Production Plan' },
  { label: 'Planning', to: '/production-plan/plan' },
  { label: isCreate.value ? 'Create New Plan' : 'Plan Details' },
])

// Header Form
const headerForm = reactive({
  plan_description: '',
  notes: '',
})

// DO Selection
const selectedDOs  = ref<number[]>([])
const showDOModal  = ref(false)

const selectedDOItems = computed(() =>
  availableDOs.value.filter((d) => selectedDOs.value.includes(d.id)),
)

const pendingDOs = computed(() =>
  availableDOs.value.filter((d) =>
    selectedDOs.value.includes(d.id) &&
    !currentPlan.value?.do_references?.some((r) => r.do_id === d.id)
  )
)

const visibleDOReferences = computed(() =>
  currentPlan.value?.do_references?.filter((r: any) =>
    selectedDOs.value.includes(r.do_id)
  ) ?? []
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

// ── Capacity state ───────────────────────────────────────────────────────────
// selectedLineId: line yang sedang aktif di capacity tab
// lineParams: data dari /line-capacity/:line_id/params (preview master sebelum save BASE)
// adjustmentForm: form untuk add adjustment setelah BASE tersimpan

const lines = ref<any[]>([])
const selectedLineId = ref<number | undefined>(undefined)
const lineParams     = ref<any>(null)
const loadingParams  = ref(false)

// Form adjustment — hanya berisi field yang bisa di-adjust + description
const adjustmentForm = reactive({
  adjustment_type:        '' as AdjustmentType | '',
  adjusted_value:         0,
  adjustment_description: '',
})

// Ambil preview params dari master saat user pilih line
async function fetchLineParams(lineId: number) {
  loadingParams.value = true
  lineParams.value    = null
  try {
    const res       = await lineCapacityService.getParams(lineId)
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
  if (id) fetchLineParams(id)
  else lineParams.value = null
})

// Dialog
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
  description: 'Please provide the reason for rejection.',
})

// Label / Color maps
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

// BASE param untuk line yang sedang dipilih
const activeBaseParam = computed(() =>
  currentPlan.value?.capacity_params?.find(
    (p: any) => p.param_type === 'BASE' && p.line_id === selectedLineId.value,
  ),
)

// Formatting helpers
function fmtDate(d?: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtNum(n?: number | null) {
  if (n == null) return '-'
  return n.toLocaleString('en-US')
}

// ── CRUD Actions ─────────────────────────────────────────────────────────────

async function handleSaveHeader() {
  try {
    if (isCreate.value) {
      if (selectedDOs.value.length === 0) {
        toastError('Select at least one Delivery Order.')
        return
      }
      const res = await planStore.createPlan({
        plan_description: headerForm.plan_description || null,
        do_ids:           selectedDOs.value,
        notes:            headerForm.notes || null,
      })
      toastSuccess(res.message || 'Plan created successfully')
      await nextTick()
      router.push({ name: 'production-plan-detail-edit', params: { id: res.data.id } })
    }
    else if (planId.value) {
      await planStore.updatePlan(planId.value, {
        plan_description: headerForm.plan_description || null,
        notes: headerForm.notes || null,
      })
      
      const currentDoIds = currentPlan.value?.do_references?.map((r: any) => r.do_id) ?? []
      const added   = selectedDOs.value.filter(id => !currentDoIds.includes(id))
      const removed = currentDoIds.filter((id: number) => !selectedDOs.value.includes(id))
      
      if (added.length > 0 || removed.length > 0) {
        await planStore.syncDOs(planId.value, { do_ids: selectedDOs.value })
        await planStore.fetchPlan(planId.value)
        selectedDOs.value = currentPlan.value?.do_references?.map((r: any) => r.do_id) ?? []
      }
      confirm.open = false
      toastSuccess('Plan updated successfully')
    }
  }
  catch (e) { toastError(e) }
}

// Simpan BASE: hanya kirim line_id, server copy dari s_line_capacity_params
async function handleSaveBase() {
  if (!planId.value || !selectedLineId.value) {
    toastError('Please select a production line first.')
    return
  }
  try {
    const res = await planStore.saveCapacityParams(planId.value, {
      line_id: selectedLineId.value,
    })
    toastSuccess(res.message || 'BASE parameters saved from line master')
    await planStore.fetchPlan(planId.value)
  }
  catch (e) { toastError(e) }
}

// Tambah adjustment untuk satu parameter saja (per submit)
async function handleSaveAdjustment() {
  if (!planId.value || !selectedLineId.value) {
    toastError('Please select a line first.')
    return
  }
  if (!adjustmentForm.adjustment_type || adjustmentForm.adjusted_value === undefined) {
    toastError('Please fill in adjustment type and value.')
    return
  }
  if (!activeBaseParam.value) {
    toastError('BASE parameters not found. Save BASE first.')
    return
  }
  try {
    await planStore.addAdjustment(planId.value, {
      line_id:                selectedLineId.value,
      adjustment_type:        adjustmentForm.adjustment_type as AdjustmentType,
      adjusted_value:         adjustmentForm.adjusted_value,
      adjustment_description: adjustmentForm.adjustment_description || undefined,
    })
    toastSuccess('Adjustment saved')
    // Reset form
    adjustmentForm.adjustment_type        = ''
    adjustmentForm.adjusted_value         = 0
    adjustmentForm.adjustment_description = ''
    await planStore.fetchPlan(planId.value)
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

// ── Approval Workflow ────────────────────────────────────────────────────────

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

function openConfirm(options: {
  title: string
  description: string
  action: () => Promise<void>
}) {
  confirm.title        = options.title
  confirm.description  = options.description
  confirm.action       = options.action
  confirm.open         = true
}

function confirmDeleteAdjustment(adjId: number) {
  openConfirm({
    title:        'Delete Adjustment',
    description:  'Adjustment will be removed and capacity will be reset.',
    action:       async () => {
      await planStore.deleteAdjustment(planId.value!, adjId)
      await planStore.fetchPlan(planId.value!)
      confirm.open = false
    },
  })
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  if (isCreate.value) planStore.fetchAvailableDOs()
})

watch(
  () => route.params.id,
  async (newId) => {
    if (!newId) return
    const id = Number(newId)

    if (isCreate.value) {
      planStore.clearCurrentPlan()
      planStore.fetchAvailableDOs()
    }
    else if (planId.value) {
      const lineRes = await lineService.getDropdown()
      lines.value = lineRes.data?.data ?? []

      planStore.clearCurrentPlan()
      await Promise.all([
        planStore.fetchPlan(id),
        planStore.fetchAvailableDOs(),
      ])

      if (currentPlan.value?.do_references) {
        selectedDOs.value = currentPlan.value.do_references.map((r: any) => r.do_id)
      }

      if (currentPlan.value) {
        headerForm.plan_description = currentPlan.value.plan_description ?? ''
        headerForm.notes            = currentPlan.value.notes ?? ''

        // Rehydrate selectedLineId dari BASE param yang tersimpan (jika ada)
        const baseParam = currentPlan.value.capacity_params?.find((p: any) => p.param_type === 'BASE')
        if (baseParam) {
          selectedLineId.value = baseParam.line_id
          // fetchLineParams dipanggil otomatis oleh watcher di atas
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

          <!-- Action buttons -->
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
                :disabled="hasImpossible || currentPlan?.overall_status === 'Not_Calculated'"
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
          description="Capacity is insufficient to meet all requests. Add adjustments in the Capacity tab and recalculate."
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
          :pending-dos="pendingDOs"
          :do-references="visibleDOReferences"
          :header-form="headerForm"
          :saving="saving"
          :fmt-date="fmtDate"
          :fmt-num="fmtNum"
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
          :adjustment-form="adjustmentForm"
          :loading="loading"
          :saving="saving"
          :calculating="calculating"
          :is-editable="isEditable"
          :plan-id="planId"
          :fmt-date="fmtDate"
          :fmt-num="fmtNum"
          :overall-status-label="overallStatusLabel"
          :overall-status-color="overallStatusColor"
          :detail-status-color="detailStatusColor"
          @update:selected-line-id="selectedLineId = $event"
          @save-base="handleSaveBase"
          @save-adjustment="handleSaveAdjustment"
          @calculate="openConfirm({
            title: 'Recalculate Capacity',
            description: 'Capacity will be recalculated based on the current BASE and adjustments. Do you want to proceed?',
            action: handleCalculate,
          })"
          @delete-adjustment="confirmDeleteAdjustment"
        />

        <!-- MODAL: PILIH DELIVERY ORDERS -->
        <PlanDOModal
          v-model:open="showDOModal"
          :available-dos="availableDOs"
          :selected-do-ids="selectedDOs"
          :loading="loading"
          :fmt-date="fmtDate"
          @toggle="toggleDO"
          @select-all="handleSelectAll"
        />

        <!-- CONFIRM DIALOG -->
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