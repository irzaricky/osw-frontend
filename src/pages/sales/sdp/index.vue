<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSdpStore } from '../../../stores/sales/sdp.store'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import { storeToRefs } from 'pinia'
import SdpAddModal from './components/SdpAddModal.vue'
import SdpDetailPanel from './components/SdpDetailPanel.vue'

const store = useSdpStore()
const { loading, plans, meta } = storeToRefs(store)
const route = useRoute()
const router = useRouter()

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Sales' },
  { label: 'Delivery Plan (SDP)' }
]

// Modal & Panel state controls
const openAddModal = ref(false)
const selectedPlanId = ref<number | null>(null)
const createLoading = ref(false)
const presetSpoId = ref<number | null>(null)

const selectedPlan = computed(() => store.detail)

// Search & filter parameters
const selectedWarehouseId = ref<number | null>(null)

function getLocalDateString() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const selectedDate = ref(getLocalDateString())

async function loadPlans() {
  const params: Record<string, any> = {
    page: 1,
    limit: 100 // load active plans for calendar scheduling mapping
  }
  if (selectedDate.value) {
    params.start_date = selectedDate.value
    params.end_date = selectedDate.value
  }
  await store.fetchSdpPlans(params)
}

// Watchers for filtering and loading
watch([selectedDate, selectedWarehouseId], () => {
  loadPlans()
})

onMounted(async () => {
  await store.fetchDropdownWarehouses()
  await store.fetchDropdownDocks()
  await loadPlans()
  
  if (store.warehouses.length > 0) {
    selectedWarehouseId.value = store.warehouses[0].id
  }
  
  // Check if spo_id is preset in query params
  if (route.query.spo_id) {
    presetSpoId.value = parseInt(route.query.spo_id as string, 10)
    openAddModal.value = true
  }
})

// Watch query parameters for seamless transitions
watch(() => route.query.spo_id, (newVal) => {
  if (newVal) {
    presetSpoId.value = parseInt(newVal as string, 10)
    openAddModal.value = true
  }
})

// Master-detail click handler
async function selectPlan(id: number) {
  selectedPlanId.value = id
  try {
    await store.fetchSdpById(id)
  } catch (e) {
    console.error('Failed to load plan details', e)
  }
}

// Form Submission Save Handler
async function handleSavePlan(payload: any) {
  createLoading.value = true
  try {
    const res = await store.createSdp(payload)
    if (res.status) {
      openAddModal.value = false
      // Clear query parameter from router to prevent repeated triggers
      if (route.query.spo_id) {
        router.replace({ path: '/sales/sdp', query: {} })
        presetSpoId.value = null
      }
      await loadPlans()
      alert('Sales Delivery Plan scheduled successfully!')
    } else {
      alert(res.message || 'Failed to schedule plan.')
    }
  } catch (e: any) {
    const msg = e.response?.data?.message || 'Error occurred while saving.'
    alert(`Scheduling Failed: ${msg}`)
  } finally {
    createLoading.value = false
  }
}

// Deletion Handler
async function handleDeletePlan(id: number) {
  if (!confirm('Are you sure you want to delete this delivery plan? This action cannot be undone.')) {
    return
  }
  try {
    const res = await store.deleteSdp(id)
    if (res.status) {
      selectedPlanId.value = null
      store.detail = null
      await loadPlans()
      alert('Plan deleted successfully.')
    } else {
      alert(res.message || 'Failed to delete plan.')
    }
  } catch (e: any) {
    alert(`Deletion Failed: ${e.response?.data?.message || e.message}`)
  }
}

// --- Scheduler Timeline Helpers ---

const hoursList = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

const activeWarehouse = computed(() => {
  return store.warehouses.find(w => w.id === selectedWarehouseId.value)
})

const activeDocks = computed(() => {
  if (!selectedWarehouseId.value) return []
  return store.docks.filter(d => d.warehouse_id === selectedWarehouseId.value)
})

const activePlansForDate = computed(() => {
  return plans.value.filter(p => {
    const pDate = p.scheduled_date.split('T')[0]
    return pDate === selectedDate.value && p.warehouse_id === selectedWarehouseId.value
  })
})

function parseTimeToDecimal(timeStr: string): number {
  if (!timeStr) return 8
  const parts = timeStr.split(':')
  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  return hours + minutes / 60
}

function getPlanStyle(plan: any) {
  const start = parseTimeToDecimal(plan.time_start)
  const end = parseTimeToDecimal(plan.time_end)
  
  // Constrain hours to 08:00 - 18:00 timeline span
  const leftHour = Math.max(8, Math.min(18, start))
  const rightHour = Math.max(8, Math.min(18, end))
  
  const leftPct = ((leftHour - 8) / 10) * 100
  const widthPct = ((rightHour - leftHour) / 10) * 100
  
  return {
    left: `${leftPct}%`,
    width: `${widthPct}%`
  }
}

function hasOverlapConflict(plan: any): boolean {
  const list = activePlansForDate.value.filter(p => p.id !== plan.id && p.dock_id === plan.dock_id)
  const pStart = parseTimeToDecimal(plan.time_start)
  const pEnd = parseTimeToDecimal(plan.time_end)
  
  return list.some(other => {
    const oStart = parseTimeToDecimal(other.time_start)
    const oEnd = parseTimeToDecimal(other.time_end)
    return oStart < pEnd && oEnd > pStart
  })
}

const conflictingDocksNames = computed(() => {
  const conflictedDocks = new Set<string>()
  activePlansForDate.value.forEach(p => {
    if (hasOverlapConflict(p)) {
      const dock = store.docks.find(d => d.id === p.dock_id)
      if (dock) conflictedDocks.add(dock.name)
    }
  })
  return Array.from(conflictedDocks)
})

function formatDateIndo(dateStr: string) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return new Date(dateStr).toLocaleDateString('id-ID')
}
</script>

<template>
  <div class="flex flex-col h-full bg-elevated/10">
    <!-- Breadcrumbs & Header -->
    <div class="px-6 pt-6 pb-4 border-b border-default space-y-3 shrink-0 bg-elevated/40">
      <Breadcrumbs :items="breadcrumbItems" />
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <UIcon name="i-lucide-calendar" class="text-primary w-7 h-7 shrink-0" />
            Sales Delivery Plan (SDP)
          </h1>
          <p class="text-xs text-muted mt-0.5">
            Plan Loading Dock timelines and manage shipping schedules digitally.
          </p>
        </div>
        <UButton
          icon="i-lucide-plus"
          color="primary"
          variant="solid"
          label="New Scheduling Plan"
          @click="openAddModal = true"
        />
      </div>
    </div>

    <!-- Active State & Visual Shell -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left side: Timeline Scheduler Workspace -->
      <div class="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
        
        <!-- Controls Filter bar -->
        <div class="bg-elevated rounded-2xl p-4 border border-default flex flex-wrap gap-4 items-center justify-between shrink-0 shadow-sm">
          <div class="flex flex-wrap items-center gap-4">
            <!-- Warehouse Selection -->
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-muted uppercase tracking-wider shrink-0">Gudang:</span>
              <USelectMenu
                v-model="selectedWarehouseId"
                :items="store.warehouses"
                value-key="id"
                label-key="name"
                class="w-64"
                placeholder="Select Warehouse"
              />
            </div>
            
            <!-- Date Filter Selector -->
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-muted uppercase tracking-wider shrink-0">Tanggal:</span>
              <UInput
                v-model="selectedDate"
                type="date"
                class="w-44"
              />
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
              WIB Timezone
            </span>
          </div>
        </div>

        <!-- Overlap Conflicts Banner Alert -->
        <div v-if="conflictingDocksNames.length > 0" class="bg-error-500/10 border border-error-500/30 text-error-700 dark:text-error-300 px-4 py-3 rounded-2xl flex items-start gap-2.5 shrink-0 shadow-sm">
          <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 shrink-0 text-error-500 mt-0.5" />
          <div>
            <h5 class="text-xs font-bold uppercase tracking-wider">Overlap Conflict Detected!</h5>
            <p class="text-xs mt-0.5 leading-relaxed">
              Multiple shipments overlap on Dock slot(s): <span class="font-bold font-mono">{{ conflictingDocksNames.join(', ') }}</span>. Overlapping blocks are highlighted below in pulsing red.
            </p>
          </div>
        </div>

        <!-- Timeline Grid Board -->
        <div class="flex-1 bg-elevated border border-default rounded-3xl p-6 flex flex-col min-w-[700px] shadow-sm relative overflow-hidden">
          
          <!-- Loading State Indicator Overlay -->
          <div v-if="loading && plans.length === 0" class="absolute inset-0 bg-elevated/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary" />
          </div>

          <!-- Empty Docks State -->
          <div v-else-if="activeDocks.length === 0" class="flex-1 flex flex-col items-center justify-center p-12 text-center gap-3">
            <div class="w-16 h-16 bg-default rounded-full flex items-center justify-center text-muted mb-2 shadow-inner">
              <UIcon name="i-lucide-warehouse" class="w-8 h-8 text-default" />
            </div>
            <div>
              <h3 class="font-bold text-default text-lg">
                No Docks Configured
              </h3>
              <p class="text-xs text-muted mt-1">
                Select another warehouse or verify loading dock settings in configuration.
              </p>
            </div>
          </div>

          <!-- Gantt Schedule Timeline -->
          <div v-else class="flex-1 flex flex-col h-full overflow-x-auto select-none">
            <!-- Timeline X-Axis Grid Hours Header Row -->
            <div class="flex border-b border-default/70 pb-3 shrink-0 font-bold uppercase tracking-wider text-[10px] text-muted">
              <div class="w-48 shrink-0 flex items-center">
                <span>Loading Docks ({{ activeWarehouse?.name }})</span>
              </div>
              <div class="flex-1 grid grid-cols-10 text-center relative pr-4">
                <div v-for="hour in hoursList.slice(0, 10)" :key="hour" class="border-l border-default/30 first:border-0 py-0.5 text-center">
                  {{ hour }}
                </div>
                <!-- 18:00 end border align pointer -->
                <div class="absolute right-0 top-0 bottom-0 text-[10px] font-bold text-muted -mr-2 select-none pointer-events-none">
                  18:00
                </div>
              </div>
            </div>

            <!-- Timeline Rows (Y-Axis) -->
            <div class="flex-1 divide-y divide-default/40 overflow-y-auto mt-2">
              <div
                v-for="dock in activeDocks"
                :key="dock.id"
                class="flex items-center min-h-[90px] group transition-all"
              >
                <!-- Dock Sticky Left Label -->
                <div class="w-48 shrink-0 pr-4 flex flex-col justify-center">
                  <span class="text-sm font-bold text-default group-hover:text-primary transition-colors">
                    {{ dock.name }}
                  </span>
                  <span class="text-[10px] font-medium text-muted mt-0.5">
                    Gudang: {{ activeWarehouse?.name }}
                  </span>
                </div>

                <!-- Relative Timeline Bar Container -->
                <div class="flex-1 h-full py-3 relative min-h-[64px]">
                  
                  <!-- Grid vertical background hour slot indicators -->
                  <div class="grid grid-cols-10 h-full w-full absolute top-0 left-0 pointer-events-none z-0 pr-4">
                    <div
                      v-for="idx in 10"
                      :key="idx"
                      class="border-l border-dashed border-default/20 h-full"
                    />
                  </div>

                  <!-- Scheduled Plans Render Slot -->
                  <div class="w-full h-full relative z-10 pr-4">
                    <div
                      v-for="plan in activePlansForDate.filter(p => p.dock_id === dock.id)"
                      :key="plan.id"
                      class="absolute top-1/2 -translate-y-1/2 rounded-2xl p-3 flex flex-col justify-center min-h-[58px] cursor-pointer transition-all border shadow-sm select-none hover:shadow-md hover:brightness-105 active:scale-[0.98] group/item overflow-hidden"
                      :style="getPlanStyle(plan)"
                      :class="[
                        selectedPlanId === plan.id
                          ? 'border-primary bg-primary/10 text-primary-800 dark:text-primary-200 font-bold'
                          : hasOverlapConflict(plan)
                            ? 'border-error-500 bg-error-500/10 text-error-800 dark:text-error-300 shadow-[0_0_12px_rgba(239,68,68,0.25)] animate-pulse'
                            : 'border-default bg-elevated/90 hover:border-muted-foreground/30 text-default'
                      ]"
                      @click="selectPlan(plan.id)"
                    >
                      <!-- Custom Tooltip Content inside the block -->
                      <div class="flex items-center justify-between gap-1 min-w-0">
                        <span class="text-[9px] font-mono font-bold tracking-tight uppercase truncate">
                          {{ plan.dp_number }}
                        </span>
                        <div class="flex items-center gap-0.5 text-[9px] text-muted group-hover/item:text-primary shrink-0 font-bold">
                          <UIcon name="i-lucide-clock" class="w-3 h-3 text-amber-500 shrink-0" />
                          <span>{{ plan.time_start.slice(0, 5) }} – {{ plan.time_end.slice(0, 5) }}</span>
                        </div>
                      </div>

                      <h4 class="text-[11px] font-bold leading-tight mt-1 truncate">
                        {{ plan.destination }}
                      </h4>

                      <!-- Overlap Conflict Warning Indicator Badge -->
                      <div v-if="hasOverlapConflict(plan)" class="absolute bottom-1 right-2 flex items-center gap-0.5 text-[8px] font-black uppercase text-error-500 animate-bounce tracking-wide shrink-0">
                        <UIcon name="i-lucide-alert-circle" class="w-2.5 h-2.5 shrink-0" />
                        <span>Conflict</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <!-- Legend Info Row -->
            <div class="border-t border-default/70 pt-4 flex flex-wrap gap-4 items-center justify-end text-[10px] text-muted font-semibold mt-4">
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded bg-elevated border border-default" />
                <span>Normal Slot</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded bg-primary/10 border border-primary" />
                <span>Selected Schedule</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded bg-error-500/10 border border-error-500 animate-pulse" />
                <span>Overlap Conflict</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      <!-- Right side: Master-Detail Panel Info -->
      <div v-if="selectedPlanId" class="w-[400px] shrink-0 border-l border-default bg-elevated/40 h-full">
        <SdpDetailPanel
          :plan="selectedPlan"
          :loading="loading"
          @close="selectedPlanId = null; store.detail = null"
          @delete="handleDeletePlan"
          @refresh="loadPlans(); selectPlan(selectedPlanId!)"
        />
      </div>
    </div>

    <!-- Modals -->
    <SdpAddModal
      v-model:open="openAddModal"
      :loading="createLoading"
      :preset-spo-id="presetSpoId"
      @save="handleSavePlan"
    />
  </div>
</template>
