<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter }             from 'vue-router'
import { storeToRefs }                     from 'pinia'
import { useWorkOrderStationStore }        from '../../../stores/production-plan/work-order-station.store'
import { useAppToast }                     from '../../../composables/useAppToast'
import { WO_STATUS_COLOR, WO_STATUS_LABEL } from './composables/useWorkOrderColumns'
import type {
  AddProgressPayload,
  ReportIssuePayload,
  ResolveIssuePayload,
  CompleteStationPayload,
} from '../../../types/production-plan/work-order'

import Breadcrumbs            from '../../../components/Breadcrumbs.vue'
import WOStationInfoBar       from './components/WOStationInfoBar.vue'
import WOProgressPanel        from './components/WOProgressPanel.vue'
import WOIssuesPanel          from './components/WOIssuesPanel.vue'
import WOStationMaterialsPanel from './components/WOStationMaterialsPanel.vue'
import WOProgressModal        from './components/WOProgressModal.vue'
import WOIssueModal           from './components/WOIssueModal.vue'
import WOResolveModal         from './components/WOResolveModal.vue'
import WOCompleteStationModal from './components/WOCompleteStationModal.vue'

const route  = useRoute()
const router = useRouter()
const store  = useWorkOrderStationStore()
const { parentWO, currentStation, progresses, issues, materials, loading, saving } = storeToRefs(store)
const { toastSuccess, toastError } = useAppToast()

const woId      = computed(() => Number(route.params.id))
const stationId = computed(() => Number(route.params.station_id))

const showProgressModal = ref(false)
const showIssueModal    = ref(false)
const showResolveModal  = ref(false)
const showCompleteModal = ref(false)
const resolveTargetId   = ref<number | null>(null)

const breadcrumbItems = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Production Plan' },
  { label: 'Work Orders', to: { name: 'work-order-list' } },
  { label: parentWO.value?.wo_number ?? '...', to: { name: 'work-order-detail-edit', params: { id: woId.value } } },
  { label: currentStation.value?.wo_station_number ?? currentStation.value?.station?.name ?? 'Station' },
])

const STATION_STATUS_COLOR: Record<string, 'neutral' | 'warning' | 'success'> = {
  Pending:     'neutral',
  In_Progress: 'warning',
  Completed:   'success',
}

const canProgress = computed(() => currentStation.value?.status === 'In_Progress')
const canIssue    = computed(() => ['In_Progress', 'Released'].includes(currentStation.value?.status ?? ''))
const canComplete = computed(() => currentStation.value?.status === 'In_Progress')

const activeIssues = computed(() => issues.value.filter((i) => !i.resolved_time))
const blockedByIssues = computed(() =>
  activeIssues.value.some((i) => i.severity === 'HIGH' || i.severity === 'CRITICAL'),
)

const progressPct = computed(() => {
  const station = currentStation.value
  if (!station || !station.planned_quantity) return 0
  return Math.min(100, Math.round(((station.actual_quantity ?? 0) / station.planned_quantity) * 100))
})

// ── Tab items ────────────────────────────────────────────────────────────────

const tabs = computed(() => [
  {
    slot:  'materials' as const,
    label: 'Materials',
    icon:  'i-lucide-package',
    count: materials.value.length,
  },
  {
    slot:  'progress' as const,
    label: 'Progress History',
    icon:  'i-lucide-trending-up',
    count: progresses.value.length,
  },
  {
    slot:  'issues' as const,
    label: 'Issues',
    icon:  'i-lucide-alert-triangle',
    count: activeIssues.value.length,
  },
])

// ── Data loading ─────────────────────────────────────────────────────────────

async function loadAll() {
  store.clearStation()
  await Promise.all([
    store.fetchStationDetail(woId.value, stationId.value),
    store.fetchProgresses(woId.value, stationId.value),
    store.fetchIssues(woId.value, stationId.value),
    store.fetchMaterials(woId.value, stationId.value),
  ])
}

// ── Handlers ─────────────────────────────────────────────────────────────────

async function handleAddProgress(payload: AddProgressPayload) {
  try {
    const res = await store.addProgress(woId.value, stationId.value, payload)
    toastSuccess(res.message || 'Progress recorded')
    showProgressModal.value = false
  } catch (e) { toastError(e) }
}

async function handleReportIssue(payload: ReportIssuePayload) {
  try {
    const res = await store.reportIssue(woId.value, stationId.value, payload)
    toastSuccess(res.message || 'Issue reported')
    showIssueModal.value = false
  } catch (e) { toastError(e) }
}

function openResolveModal(issueId: number) {
  resolveTargetId.value  = issueId
  showResolveModal.value = true
}

async function handleResolveIssue(payload: ResolveIssuePayload) {
  if (!resolveTargetId.value) return
  try {
    const res = await store.resolveIssue(woId.value, stationId.value, resolveTargetId.value, payload)
    toastSuccess(res.message || 'Issue resolved')
    showResolveModal.value = false
    resolveTargetId.value  = null
  } catch (e) { toastError(e) }
}

async function handleCompleteStation(payload: CompleteStationPayload) {
  try {
    const res = await store.completeStation(woId.value, stationId.value, payload)
    toastSuccess(res.message || 'Station completed')
    showCompleteModal.value = false
    // Refresh to reflect potential WO auto-completion
    await store.fetchStationDetail(woId.value, stationId.value)
  } catch (e) { toastError(e) }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(loadAll)

watch([woId, stationId], loadAll)
</script>

<template>
  <UDashboardPanel id="work-order-station-detail">
    <template #header>
      <UDashboardNavbar title="Station Detail">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div v-if="loading && !currentStation" class="flex items-center justify-center py-24">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted" />
      </div>

      <!-- Not found -->
      <div v-else-if="!currentStation && !loading" class="flex flex-col items-center justify-center py-24 gap-4">
        <UIcon name="i-lucide-file-x-2" class="w-12 h-12 text-muted" />
        <p class="text-sm text-muted">Station not found</p>
        <UButton
          label="Back to Work Order"
          color="neutral"
          variant="soft"
          @click="router.push({ name: 'work-order-detail-edit', params: { id: woId } })"
        />
      </div>

      <div v-else-if="currentStation" class="space-y-6">
        <Breadcrumbs :items="breadcrumbItems" />

        <!-- Header -->
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <UButton
              icon="i-lucide-arrow-left"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="router.push({ name: 'work-order-detail-edit', params: { id: woId } })"
            />
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-2xl font-bold">
                  {{ currentStation.station?.name ?? `Station #${currentStation.station_id}` }}
                </h1>
                <UBadge
                  v-if="currentStation.wo_station_number"
                  :label="currentStation.wo_station_number"
                  color="neutral"
                  variant="outline"
                  class="font-mono"
                />
                <UBadge
                  :label="currentStation.status.replace('_', ' ')"
                  :color="STATION_STATUS_COLOR[currentStation.status]"
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
                {{ parentWO?.wo_number }} · {{ currentStation.station?.station_code }}
              </p>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex items-center gap-2 flex-wrap">
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
              label="Complete Station"
              icon="i-lucide-check-circle"
              color="success"
              :loading="saving"
              :disabled="blockedByIssues"
              @click="showCompleteModal = true"
            />
          </div>
        </div>

        <!-- Alerts -->
        <UAlert
          v-if="blockedByIssues"
          color="error"
          variant="soft"
          icon="i-lucide-shield-x"
          title="Completion Blocked"
          :description="`${activeIssues.filter(i => i.severity === 'HIGH' || i.severity === 'CRITICAL').length} unresolved HIGH/CRITICAL issue(s) must be resolved first.`"
        />
        <UAlert
          v-else-if="activeIssues.length > 0"
          color="warning"
          variant="soft"
          icon="i-lucide-alert-triangle"
          :title="`${activeIssues.length} Active Issue${activeIssues.length > 1 ? 's' : ''}`"
          description="Resolve all open issues before completing this station."
        />
        <UAlert
          v-if="currentStation.notes"
          color="info"
          variant="soft"
          icon="i-lucide-sticky-note"
          :description="currentStation.notes"
        />

        <WOStationInfoBar
          :station="currentStation"
          :progress-pct="progressPct"
          :parent-wo="parentWO"
        />

        <!-- Tabs: Progress / Issues / Materials -->
        <UTabs :items="tabs" variant="link" class="w-full">
          <template #progress>
            <WOProgressPanel
              :progresses="progresses"
              :planned-qty="currentStation.planned_quantity ?? 0"
              :actual-qty="currentStation.actual_quantity ?? 0"
              :loading="loading"
            />
          </template>

          <template #issues>
            <WOIssuesPanel
              :issues="issues"
              :loading="loading"
              :saving="saving"
              @resolve="openResolveModal"
            />
          </template>

          <template #materials>
            <WOStationMaterialsPanel
              :materials="materials"
              :station-status="currentStation.status"
              :wo-id="woId"
              :station-id="stationId"
              :saving="saving"
            />
          </template>
        </UTabs>

        <!-- Modals -->
        <WOProgressModal
          v-model:open="showProgressModal"
          :planned-qty="currentStation.planned_quantity ?? 0"
          :current-cumulative="currentStation.actual_quantity ?? 0"
          :loading="saving"
          @submit="handleAddProgress"
        />

        <WOIssueModal
          v-model:open="showIssueModal"
          :loading="saving"
          @submit="handleReportIssue"
        />

        <WOResolveModal
          v-model:open="showResolveModal"
          :loading="saving"
          @submit="handleResolveIssue"
        />

        <WOCompleteStationModal
          v-model:open="showCompleteModal"
          :station="currentStation"
          :parent-wo="parentWO"
          :loading="saving"
          @submit="handleCompleteStation"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>