<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CalendarDate } from '@internationalized/date'
import { useSdpStore } from '../../../stores/sales/sdp.store'
import sdpService from '../../../services/sales/sdp.service'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import { storeToRefs } from 'pinia'
import SdpAddModal from './components/SdpAddModal.vue'
import SdpDetailPanel from './components/SdpDetailPanel.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import { useAppToast } from '../../../composables/useAppToast'
import HomeDateRangePicker from '../../../components/home/HomeDateRangePicker.vue'

const { toastSuccess, toastError } = useAppToast()

const store = useSdpStore()
const { loading, plans } = storeToRefs(store)
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
const isMasterListOpen = ref(false)

const selectedPlan = computed(() => store.detail)

const confirmDialog = ref({
  open: false,
  title: 'Delete Delivery Plan',
  description: 'Are you sure you want to delete this delivery plan? This action cannot be undone.',
  id: null as number | null
})

// Search & filter parameters
const selectedWarehouseId = ref<number | undefined>(undefined)
const selectedStatus = ref<string | undefined>(undefined)
const statusOptions = ['Draft', 'Scheduled', 'Shipped']




function getLocalDateString() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const selectedDate = ref(getLocalDateString())
const mlStartDate = ref(getLocalDateString())
const mlEndDate = ref(getLocalDateString())

const selectedDateModel = computed({
  get() {
    if (!selectedDate.value) return null
    const [y, m, d] = selectedDate.value.split('-').map(Number)
    return new CalendarDate(y, m, d)
  },
  set(val: CalendarDate | null) {
    if (!val) {
      selectedDate.value = ''
      return
    }
    const yyyy = val.year
    const mm = String(val.month).padStart(2, '0')
    const dd = String(val.day).padStart(2, '0')
    selectedDate.value = `${yyyy}-${mm}-${dd}`
  }
})

function formatDate(date?: Date) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(value?: string) {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const mlDateRange = computed({
  get() {
    return {
      start: parseDate(mlStartDate.value),
      end: parseDate(mlEndDate.value)
    }
  },
  set(value: any) {
    mlStartDate.value = formatDate(value?.start)
    mlEndDate.value = formatDate(value?.end)
  }
})

const masterPlans = ref<any[]>([])
const masterLoading = ref(false)
const masterMeta = ref({ page: 1, limit: 10, total: 0 })

async function loadGanttPlans() {
  const params: Record<string, any> = {
    page: 1,
    limit: 100
  }
  if (selectedDate.value) {
    params.start_date = selectedDate.value
    params.end_date = selectedDate.value
  }
  await store.fetchSdpPlans(params)
}

async function loadMasterPlans() {
  if (!mlStartDate.value || !mlEndDate.value) return
  masterLoading.value = true
  try {
    const params: Record<string, any> = {
      page: masterMeta.value.page,
      limit: masterMeta.value.limit,
      start_date: mlStartDate.value,
      end_date: mlEndDate.value
    }
    if (selectedStatus.value) params.status = selectedStatus.value
    if (selectedWarehouseId.value) params.warehouse_id = selectedWarehouseId.value
    const res = await sdpService.getSdpPlans(params)
    if (res.data?.status) {
      masterPlans.value = res.data.data.rows
      masterMeta.value.total = res.data.data.count
    }
  } catch (e) {
    console.error('Failed to load master plans', e)
  } finally {
    masterLoading.value = false
  }
}

// Watchers for filtering and loading
watch([selectedDate, selectedWarehouseId], () => {
  loadGanttPlans()
})

watch([mlStartDate, mlEndDate, selectedStatus, selectedWarehouseId], () => {
  masterMeta.value.page = 1
  loadMasterPlans()
})

onMounted(async () => {
  await store.fetchDropdownWarehouses()
  await store.fetchDropdownDocks()
  await store.fetchShifts()
  await loadGanttPlans()
  await loadMasterPlans()
  
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
      await loadGanttPlans()
      await loadMasterPlans()
      toastSuccess('Sales Delivery Plan scheduled successfully!')
    } else {
      toastError(res.message || 'Failed to schedule plan.')
    }
  } catch (e: any) {
    const msg = e.response?.data?.message || 'Error occurred while saving.'
    toastError(`Scheduling Failed: ${msg}`)
  } finally {
    createLoading.value = false
  }
}

// Deletion Handler
function handleDeletePlan(id: number) {
  confirmDialog.value.id = id
  confirmDialog.value.open = true
}

async function executeDeletePlan() {
  const id = confirmDialog.value.id
  if (!id) return
  confirmDialog.value.open = false
  try {
    const res = await store.deleteSdp(id)
    if (res.status) {
      selectedPlanId.value = null
      store.detail = null
      await loadGanttPlans()
      await loadMasterPlans()
      toastSuccess('Plan deleted successfully.')
    } else {
      toastError(res.message || 'Failed to delete plan.')
    }
  } catch (e: any) {
    toastError(`Deletion Failed: ${e.response?.data?.message || e.message}`)
  }
}

// --- Scheduler Timeline Helpers ---

const minHour = computed(() => {
  if (!store.shifts || store.shifts.length === 0) return 8
  const hours = store.shifts.map(s => {
    const time = s.start_time
    const hr = parseInt(time.split(':')[0], 10)
    return isNaN(hr) ? 8 : hr
  })
  return Math.min(...hours)
})

const maxHour = computed(() => {
  if (!store.shifts || store.shifts.length === 0) return 18
  const hours = store.shifts.map(s => {
    const time = s.end_time
    const hr = Math.ceil(parseTimeToDecimal(time))
    return isNaN(hr) ? 18 : hr
  })
  return Math.max(...hours)
})

const totalHours = computed(() => {
  return maxHour.value - minHour.value
})

const timelineMinWidth = computed(() => {
  return 192 + totalHours.value * 120
})

const hoursList = computed(() => {
  const list = []
  const start = minHour.value
  const end = maxHour.value
  for (let h = start; h <= end; h++) {
    const pad = String(h).padStart(2, '0')
    list.push(`${pad}:00`)
  }
  return list
})

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
    return pDate === selectedDate.value && (!selectedWarehouseId.value || p.warehouse_id === selectedWarehouseId.value)
  })
})

const filteredMasterList = computed(() => masterPlans.value)

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
  
  // Constrain hours to dynamic timeline span
  const leftHour = Math.max(minHour.value, Math.min(maxHour.value, start))
  const rightHour = Math.max(minHour.value, Math.min(maxHour.value, end))
  
  const leftPct = ((leftHour - minHour.value) / totalHours.value) * 100
  const widthPct = ((rightHour - leftHour) / totalHours.value) * 100
  
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
              <span class="text-xs font-bold text-muted uppercase tracking-wider shrink-0">Warehouse:</span>
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
              <span class="text-xs font-bold text-muted uppercase tracking-wider shrink-0">Date:</span>
              <UInputDate v-model="selectedDateModel" class="w-44">
                <template #trailing>
                  <UPopover>
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      icon="i-lucide-calendar"
                      class="px-0"
                    />
                    <template #content>
                      <UCalendar
                        v-model="selectedDateModel"
                        class="p-2"
                      />
                    </template>
                  </UPopover>
                </template>
              </UInputDate>
            </div>

          </div>
          
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
              WIB Timezone
            </span>
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
            <div :style="{ minWidth: `${timelineMinWidth}px` }" class="flex-1 flex flex-col h-full min-w-max pb-2">
            <!-- Timeline X-Axis Grid Hours Header Row -->
            <div class="flex border-b border-default/70 pb-3 shrink-0 font-bold uppercase tracking-wider text-[10px] text-muted">
              <div class="w-48 shrink-0 flex items-center">
                <span class="text-sm text-default font-extrabold normal-case">Loading Docks ({{ activeWarehouse?.name }})</span>
              </div>
              <div class="flex-1 grid text-center relative pr-4" :style="{ gridTemplateColumns: `repeat(${totalHours}, minmax(0, 1fr))` }">
                <div v-for="hour in hoursList.slice(0, totalHours)" :key="hour" class="border-l border-default/30 first:border-0 py-0.5 text-center">
                  {{ hour }}
                </div>
                <!-- Dynamic end border align pointer -->
                <div class="absolute right-0 top-0 bottom-0 text-[10px] font-bold text-muted -mr-2 select-none pointer-events-none">
                  {{ hoursList[hoursList.length - 1] }}
                </div>
              </div>
            </div>

            <!-- Timeline Rows (Y-Axis) -->
            <div class="flex-1 divide-y divide-default/40 overflow-y-auto mt-2">
              <div
                v-for="dock in activeDocks"
                :key="dock.id"
                class="flex items-center min-h-[120px] group transition-all"
              >
                <!-- Dock Sticky Left Label -->
                <div class="w-48 shrink-0 pr-4 flex flex-col justify-center">
                  <span class="text-lg font-black text-default group-hover:text-primary transition-colors">
                    {{ dock.name }}
                  </span>
                  <span class="text-xs font-semibold text-muted mt-1">
                    Warehouse: {{ activeWarehouse?.name }}
                  </span>
                </div>

                <!-- Relative Timeline Bar Container -->
                <div class="flex-1 h-full py-3 relative min-h-[64px]">
                  <!-- Grid vertical background hour slot indicators -->
                  <div class="grid h-full w-full absolute top-0 left-0 pointer-events-none z-0 pr-4" :style="{ gridTemplateColumns: `repeat(${totalHours}, minmax(0, 1fr))` }">
                    <div
                      v-for="idx in totalHours"
                      :key="idx"
                      class="border-l border-dashed border-default/20 h-full"
                    />
                  </div>

                  <!-- Scheduled Plans Render Slot -->
                  <div class="w-full h-full relative z-10 pr-4">
                    <div
                      v-for="plan in activePlansForDate.filter(p => p.dock_id === dock.id)"
                      :key="plan.id"
                      class="absolute top-1/2 -translate-y-1/2 rounded-2xl p-4 flex flex-col justify-center min-h-[72px] cursor-pointer transition-all border shadow-sm select-none hover:shadow-md hover:brightness-105 active:scale-[0.98] group/item overflow-hidden"
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
                        <span class="text-xs font-mono font-bold tracking-tight uppercase truncate">
                          {{ plan.dp_number }}
                        </span>
                        <div class="flex items-center gap-1 text-xs text-muted group-hover/item:text-primary shrink-0 font-bold">
                          <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{{ plan.time_start.slice(0, 5) }} – {{ plan.time_end.slice(0, 5) }}</span>
                        </div>
                      </div>

                      <h4 class="text-sm font-bold leading-tight mt-1.5 truncate">
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
            <div class="border-t border-default/70 pt-4 flex flex-wrap gap-4 items-center justify-end text-sm text-muted font-bold mt-4">
              <div class="flex items-center gap-2">
                <div class="w-3.5 h-3.5 rounded bg-elevated border border-default" />
                <span>Normal Slot</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3.5 h-3.5 rounded bg-primary/10 border border-primary" />
                <span>Selected Schedule</span>
              </div>
            </div>
          </div>
        </div>
        </div>

        <!-- Collapsible Master List Panel -->
        <div class="bg-elevated border border-default rounded-3xl p-5 shadow-sm shrink-0 flex flex-col space-y-4">
          <div class="flex items-center justify-between cursor-pointer select-none" @click="isMasterListOpen = !isMasterListOpen">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-list" class="w-4 h-4 text-primary" />
              <h3 class="font-bold text-sm text-default">
                Active Scheduled Plans
              </h3>
              <UBadge color="neutral" variant="subtle" size="xs">
                {{ filteredMasterList.length }}
              </UBadge>
            </div>
            <UIcon
              :name="isMasterListOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="w-4 h-4 text-muted transition-transform"
            />
          </div>

          <div v-show="isMasterListOpen" class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-[300px] shrink-0">
                <HomeDateRangePicker
                  v-model="mlDateRange as any"
                  class="w-full"
                  clear
                />
              </div>

              <USelectMenu
                v-model="selectedStatus"
                :items="statusOptions"
                class="w-40 shrink-0"
                placeholder="All Status"
                clear
              />
            </div>
            <div class="overflow-x-auto border border-default rounded-2xl">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-default text-muted-foreground bg-default/40 font-bold">
                    <th class="p-3">
                      DP Number
                    </th>
                    <th class="p-3">
                      Scheduled Date
                    </th>
                    <th class="p-3">
                      Time Start
                    </th>
                    <th class="p-3">
                      Time End
                    </th>
                    <th class="p-3">
                      Destination
                    </th>
                    <th class="p-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-default/40">
                  <tr
                    v-for="plan in filteredMasterList"
                    :key="plan.id"
                    class="hover:bg-default/20 transition-colors cursor-pointer text-sm"
                    :class="selectedPlanId === plan.id ? 'bg-primary/5 font-semibold text-primary' : ''"
                    @click="selectPlan(plan.id)"
                  >
                    <td class="p-3 font-mono font-bold">
                      {{ plan.dp_number }}
                    </td>
                    <td class="p-3">
                      {{ plan.scheduled_date.split('T')[0] }}
                    </td>
                    <td class="p-3">
                      {{ plan.time_start.slice(0, 5) }}
                    </td>
                    <td class="p-3">
                      {{ plan.time_end.slice(0, 5) }}
                    </td>
                    <td class="p-3">
                      {{ plan.destination }}
                    </td>
                    <td class ="p-3">
                      {{ plan.status }}
                    </td>
                  </tr>
                  <tr v-if="filteredMasterList.length === 0">
                    <td colspan="5" class="p-4 text-center text-muted">
                      No active plans for this date range/warehouse.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="flex items-center justify-between gap-3 pt-4">
              <div class="text-sm text-muted">
                Total {{ masterMeta.total }} plan(s)
              </div>
              <UPagination v-model:page="masterMeta.page" :total="masterMeta.total" :items-per-page="masterMeta.limit" @update:page="loadMasterPlans" />
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
          @refresh="loadGanttPlans(); loadMasterPlans(); selectPlan(selectedPlanId!)"
        />
      </div>

      <!-- Modals -->
      <SdpAddModal
        v-model:open="openAddModal"
        :loading="createLoading"
        :preset-spo-id="presetSpoId"
        @save="handleSavePlan"
      />

      <!-- Confirm Dialog -->
      <ConfirmDialog
        v-model:open="confirmDialog.open"
        :title="confirmDialog.title"
        :description="confirmDialog.description"
        confirm-label="Delete"
        :loading="loading"
        @confirm="executeDeletePlan"
      />
    </div>
  </div>
</template>
