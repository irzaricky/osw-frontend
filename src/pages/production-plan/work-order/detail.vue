<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs }         from 'pinia'
import { useWorkOrderStore }   from '../../../stores/production-plan/work-order.store'
import { useAppToast }         from '../../../composables/useAppToast'
import { WO_STATUS_COLOR, WO_STATUS_LABEL } from './composables/useWorkOrderColumns'
import type {
  WorkOrderStatus,
  AddProgressPayload,
  ReportIssuePayload,
  ResolveIssuePayload,
  CompleteWorkOrderPayload,
  UpdateStationJobStatusPayload,
  JobStatus,
  IssueType,
} from '../../../types/production-plan/work-order'

import Breadcrumbs        from '../../../components/Breadcrumbs.vue'
import ConfirmDialog      from '../../../components/ConfirmDialog.vue'
import WOInfoBar          from './components/WOInfoBar.vue'
import WOStationsPanel    from './components/WOStationsPanel.vue'
import WOProgressPanel    from './components/WOProgressPanel.vue'
import WOIssuesPanel      from './components/WOIssuesPanel.vue'
import WOStartModal       from './components/WOStartModal.vue'
import WOProgressModal    from './components/WOProgressModal.vue'
import WOIssueModal       from './components/WOIssueModal.vue'
import WOCompleteModal    from './components/WOCompleteModal.vue'
import WOResolveModal     from './components/WOResolveModal.vue'

const route  = useRoute()
const router = useRouter()
const store  = useWorkOrderStore()
const { currentWO, loading, saving } = storeToRefs(store)
const { toastSuccess, toastError }   = useAppToast()

const woId = computed(() => Number(route.params.id))

// ── Modal states ──────────────────────────────────────────────────────────────
const showStartModal    = ref(false)
const showProgressModal = ref(false)
const showIssueModal    = ref(false)
const showCompleteModal = ref(false)
const showResolveModal  = ref(false)
const resolveTargetId   = ref<number | null>(null)

// ── Confirm dialog ────────────────────────────────────────────────────────────
const confirm = reactive({
  open:         false,
  title:        '',
  description:  '',
  confirmLabel: 'Confirm',
  confirmColor: 'primary' as 'primary' | 'error' | 'success',
  action:       null as (() => Promise<void>) | null,
})

function openConfirm(opts: {
  title:        string
  description:  string
  confirmLabel?: string
  confirmColor?: 'primary' | 'error' | 'success'
  action:       () => Promise<void>
}) {
  confirm.title        = opts.title
  confirm.description  = opts.description
  confirm.confirmLabel = opts.confirmLabel ?? 'Confirm'
  confirm.confirmColor = opts.confirmColor ?? 'primary'
  confirm.action       = opts.action
  confirm.open         = true
}

// ── Breadcrumbs ───────────────────────────────────────────────────────────────
const breadcrumbItems = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Production Plan' },
  { label: 'Work Orders', to: {name: 'work-order-list'} },
  { label: currentWO.value?.wo_number ?? '...' },
])

// ── Actions ───────────────────────────────────────────────────────────────────

async function handleStart() {
  try {
    const res = await store.startWorkOrder(woId.value)
    toastSuccess(res.message || 'Work Order started')
    showStartModal.value = false
    await store.fetchWorkOrder(woId.value)
  }
  catch (e) { toastError(e) }
}

async function handleAddProgress(payload: AddProgressPayload) {
  try {
    const res = await store.addProgress(woId.value, payload)
    toastSuccess(res.message || 'Progress recorded')
    showProgressModal.value = false
    await store.fetchWorkOrder(woId.value)
  }
  catch (e) { toastError(e) }
}

async function handleReportIssue(payload: ReportIssuePayload) {
  try {
    const res = await store.reportIssue(woId.value, payload)
    toastSuccess(res.message || 'Issue reported')
    showIssueModal.value = false
    await store.fetchWorkOrder(woId.value)
  }
  catch (e) { toastError(e) }
}

async function handleResolveIssue(payload: ResolveIssuePayload) {
  if (!resolveTargetId.value) return
  try {
    const res = await store.resolveIssue(woId.value, resolveTargetId.value, payload)
    toastSuccess(res.message || 'Issue resolved')
    showResolveModal.value = false
    resolveTargetId.value  = null
    await store.fetchWorkOrder(woId.value)
  }
  catch (e) { toastError(e) }
}

function openResolveModal(issueId: number) {
  resolveTargetId.value  = issueId
  showResolveModal.value = true
}

async function handleComplete(payload: CompleteWorkOrderPayload) {
  try {
    const res = await store.completeWorkOrder(woId.value, payload)
    toastSuccess(res.message || 'Work Order completed')
    showCompleteModal.value = false
    await store.fetchWorkOrder(woId.value)
  }
  catch (e) { toastError(e) }
}

async function handleUpdateJobStatus(
  stationId: number,
  jobId:     number,
  payload:   UpdateStationJobStatusPayload,
) {
  try {
    const res = await store.updateStationJobStatus(woId.value, stationId, jobId, payload)
    toastSuccess(res.message || 'Job status updated')
    await store.fetchWorkOrder(woId.value)
  }
  catch (e) { toastError(e) }
}

// ── Computed helpers ──────────────────────────────────────────────────────────

const canStart    = computed(() => currentWO.value?.status === 'Released')
const canProgress = computed(() => currentWO.value?.status === 'In_Progress')
const canComplete = computed(() => currentWO.value?.status === 'In_Progress')
const canIssue    = computed(() =>
  currentWO.value?.status === 'In_Progress' || currentWO.value?.status === 'Released',
)

const progressPct = computed(() => {
  const wo = currentWO.value
  if (!wo || wo.planned_quantity === 0) return 0
  return Math.min(100, Math.round((wo.actual_quantity / wo.planned_quantity) * 100))
})

const activeIssues = computed(() =>
  (currentWO.value?.issues ?? []).filter((i) => !i.resolved_time),
)

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  store.clearCurrentWO()
  await store.fetchWorkOrder(woId.value)
})

watch(
  () => route.params.id,
  async (newId) => {
    if (!newId) return
    store.clearCurrentWO()
    await store.fetchWorkOrder(Number(newId))
  },
)
</script>

<template>
  <UDashboardPanel id="work-order-detail">
    <template #header>
      <UDashboardNavbar title="Work Order Detail">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="loading && !currentWO" class="flex items-center justify-center py-24">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted" />
      </div>

      <div v-else-if="!currentWO && !loading" class="flex flex-col items-center justify-center py-24 gap-4">
        <UIcon name="i-lucide-file-x-2" class="w-12 h-12 text-muted" />
        <p class="text-sm text-muted">Work Order not found</p>
        <UButton label="Back to List" color="neutral" variant="soft" @click="router.push({name: 'work-order-list'})" />
      </div>

      <div v-else-if="currentWO" class="space-y-6">
        <Breadcrumbs :items="breadcrumbItems" />

        <!-- Page Header -->
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <UButton
              icon="i-lucide-arrow-left"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="router.push({name: 'work-order-list'})"
            />
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-2xl font-bold font-mono">
                  {{ currentWO.wo_number }}
                </h1>
                <UBadge
                  :label="WO_STATUS_LABEL[currentWO.status]"
                  :color="WO_STATUS_COLOR[currentWO.status]"
                  variant="subtle"
                />
                <UBadge
                  v-if="activeIssues.length > 0"
                  :label="`${activeIssues.length} Active Issue${activeIssues.length > 1 ? 's' : ''}`"
                  color="error"
                  variant="soft"
                />
              </div>
              <p class="text-sm text-muted mt-0.5">
                {{ currentWO.part?.part_name }} · {{ currentWO.line?.name }}
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2 flex-wrap">
            <UButton
              v-if="canStart"
              label="Start WO"
              icon="i-lucide-play"
              color="primary"
              :loading="saving"
              @click="showStartModal = true"
            />
            <UButton
              v-if="canProgress"
              label="Report Progress"
              icon="i-lucide-trending-up"
              color="primary"
              variant="soft"
              :loading="saving"
              @click="showProgressModal = true"
            />
            <UButton
              v-if="canIssue"
              label="Report Issue"
              icon="i-lucide-alert-triangle"
              color="warning"
              variant="soft"
              :loading="saving"
              @click="showIssueModal = true"
            />
            <UButton
              v-if="canComplete"
              label="Complete WO"
              icon="i-lucide-check-circle"
              color="success"
              :loading="saving"
              @click="showCompleteModal = true"
            />
          </div>
        </div>

        <!-- Alert: Active Issues -->
        <UAlert
          v-if="activeIssues.length > 0"
          color="error"
          variant="soft"
          icon="i-lucide-alert-triangle"
          :title="`${activeIssues.length} Unresolved Issue${activeIssues.length > 1 ? 's' : ''}`"
          :description="`There ${activeIssues.length > 1 ? 'are' : 'is'} ${activeIssues.length} active issue${activeIssues.length > 1 ? 's' : ''} on this Work Order. Resolve them before completing.`"
        />

        <!-- Info Bar -->
        <WOInfoBar :wo="currentWO" :progress-pct="progressPct" />

        <!-- Tabs -->
        <UTabs
          :items="[
            { slot: 'stations' as const, label: 'Process Stations', icon: 'i-lucide-layout-grid' },
            { slot: 'progress' as const, label: 'Progress History', icon: 'i-lucide-trending-up' },
            { slot: 'issues' as const, label: 'Issues', icon: 'i-lucide-alert-triangle' },
          ]"
          variant="link"
          class="w-full"
        >
          <template #stations>
            <WOStationsPanel
              :stations="currentWO.stations ?? []"
              :wo-status="currentWO.status"
              :saving="saving"
              @update-job-status="handleUpdateJobStatus"
            />
          </template>

          <template #progress>
            <WOProgressPanel
              :progresses="currentWO.progresses ?? []"
              :planned-qty="currentWO.planned_quantity"
              :actual-qty="currentWO.actual_quantity"
              :loading="loading"
            />
          </template>

          <template #issues>
            <WOIssuesPanel
              :issues="currentWO.issues ?? []"
              :loading="loading"
              :saving="saving"
              @resolve="openResolveModal"
            />
          </template>
        </UTabs>

        <!-- ── Modals ──────────────────────────────────────────────────── -->

        <WOStartModal
          v-model:open="showStartModal"
          :wo="currentWO"
          :loading="saving"
          @confirm="handleStart"
        />

        <WOProgressModal
          v-model:open="showProgressModal"
          :wo="currentWO"
          :loading="saving"
          @submit="handleAddProgress"
        />

        <WOIssueModal
          v-model:open="showIssueModal"
          :wo="currentWO"
          :loading="saving"
          @submit="handleReportIssue"
        />

        <WOCompleteModal
          v-model:open="showCompleteModal"
          :wo="currentWO"
          :loading="saving"
          @submit="handleComplete"
        />

        <WOResolveModal
          v-model:open="showResolveModal"
          :loading="saving"
          @submit="handleResolveIssue"
        />

        <!-- Confirm Dialog -->
        <ConfirmDialog
          v-model:open="confirm.open"
          :title="confirm.title"
          :description="confirm.description"
          :confirm-label="confirm.confirmLabel"
          :loading="saving"
          @confirm="confirm.action?.()"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>