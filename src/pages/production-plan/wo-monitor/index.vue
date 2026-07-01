<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs }              from 'pinia'
import { useWorkOrderMonitorStore } from '../../../stores/production-plan/wo-monitor.store'
import { useAppToast }              from '../../../composables/useAppToast'
import type { WOHealth, MonitorWO } from '../../../types/production-plan/wo-monitor'

import Breadcrumbs         from '../../../components/Breadcrumbs.vue'
import WOMonitorSummaryBar from './components/WOMonitorSummaryBar.vue'
import WOMonitorCard       from './components/WOMonitorCard.vue'
import WOMonitorFilters    from './components/WOMonitorFilters.vue'
import WOResolveIssueModal from './components/WOResolveIssueModal.vue'

const store = useWorkOrderMonitorStore()
const { summary, workOrders, loading, saving, lastFetched } = storeToRefs(store)
const { toastSuccess, toastError } = useAppToast()

const today = new Date()
const workDate     = ref(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`)
const filterHealth = ref<WOHealth | undefined>(undefined)

const showResolveModal = ref(false)
const activeWoId       = ref<number | null>(null)

const activeWo = computed<MonitorWO | null>(() =>
  workOrders.value.find((w) => w.id === activeWoId.value) ?? null,
)

const REFRESH_INTERVAL = 60_000
let refreshTimer: ReturnType<typeof setInterval> | null = null

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Production Plan' },
  { label: 'Work Order Monitoring' },
]

async function fetchData() {
  await store.fetchLiveMonitor({ work_date: workDate.value })
}

const filteredWOs = computed(() => {
  if (!filterHealth.value) return workOrders.value
  return workOrders.value.filter((wo) => wo.health === filterHealth.value)
})

const groupedByLine = computed(() => {
  const groups: Record<string, typeof filteredWOs.value> = {}
  for (const wo of filteredWOs.value) {
    const key = wo.line?.name ?? 'Unknown Line'
    if (!groups[key]) groups[key] = []
    groups[key].push(wo)
  }
  return groups
})

const lastFetchedLabel = computed(() => {
  if (!lastFetched.value) return ''
  return `Updated ${lastFetched.value.toLocaleTimeString('en-US', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })}`
})

function openResolveModal(wo: MonitorWO) {
  activeWoId.value       = wo.id
  showResolveModal.value = true
}

async function handleResolveIssue(payload: {
  woStationId:           number
  issueId:               number
  resolution:            string
  resolvedBy:            number
  resumedBy?:            number
  resumedAt?:            string | null
  pauseDurationMinutes?: number | null
  downtimeEnd?:          string | null
}) {
  if (!activeWoId.value) return
  try {
    const res = await store.resolveIssue(activeWoId.value, payload.woStationId, payload.issueId, {
      resolution:             payload.resolution,
      resolved_by:            payload.resolvedBy,
      resumed_by:             payload.resumedBy             ?? null,
      resumed_at:             payload.resumedAt             ?? null,
      pause_duration_minutes: payload.pauseDurationMinutes  ?? null,
      downtime_end:           payload.downtimeEnd           ?? null,
    })
    toastSuccess(res?.message || 'Issue resolved')
  } catch (e) {
    toastError(e)
  }
}

watch(workDate, fetchData)

onMounted(() => {
  fetchData()
  refreshTimer = setInterval(fetchData, REFRESH_INTERVAL)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  store.clear()
})
</script>

<template>
  <UDashboardPanel id="wo-monitor">
    <template #header>
      <UDashboardNavbar title="Live Monitor">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <div class="flex items-center gap-3">
            <span v-if="lastFetchedLabel" class="text-xs text-muted hidden sm:block">
              {{ lastFetchedLabel }}
            </span>
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="ghost"
              size="sm"
              :loading="loading"
              @click="fetchData"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-5">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 class="text-2xl font-bold">Live Monitor</h1>
            <p class="text-sm text-muted mt-0.5">Real-time Work Order status for the production floor</p>
          </div>
          <div class="flex items-center gap-2 text-xs text-muted">
            <UIcon name="i-lucide-refresh-cw" class="w-3.5 h-3.5" />
            Auto-refreshes every 60 seconds
          </div>
        </div>

        <WOMonitorFilters
          :filters="{ health: filterHealth }"
          :work-date="workDate"
          @update:filters="(v) => { filterHealth = v.health }"
          @update:work-date="workDate = $event"
        />

        <div v-if="loading && !summary" class="flex items-center justify-center py-24">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted" />
        </div>

        <template v-else-if="summary">
          <WOMonitorSummaryBar :summary="summary" />

          <div
            v-if="filteredWOs.length === 0"
            class="flex flex-col items-center justify-center py-20 text-center text-muted gap-3"
          >
            <UIcon name="i-lucide-clipboard-x" class="w-10 h-10" />
            <p class="text-sm font-medium">No Work Orders found for this date.</p>
          </div>

          <div v-else class="space-y-6">
            <div
              v-for="(wos, lineName) in groupedByLine"
              :key="lineName"
            >
              <div class="flex items-center gap-2 mb-3">
                <UIcon name="i-lucide-layout-grid" class="w-4 h-4 text-muted" />
                <h2 class="text-sm font-semibold">{{ lineName }}</h2>
                <UBadge :label="`${wos.length} WO`" color="neutral" variant="soft" size="xs" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <WOMonitorCard
                  v-for="wo in wos"
                  :key="wo.id"
                  :wo="wo"
                  @select="openResolveModal"
                />
              </div>
            </div>
          </div>
        </template>

        <div v-else class="flex flex-col items-center justify-center py-24 text-center text-muted gap-3">
          <UIcon name="i-lucide-monitor-x" class="w-10 h-10" />
          <p class="text-sm">No data available. Select a date to load monitor data.</p>
        </div>

        <WOResolveIssueModal
          v-model:open="showResolveModal"
          :wo="activeWo"
          :saving="saving"
          @resolve="handleResolveIssue"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>