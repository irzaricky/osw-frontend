<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, reactive } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useForecastStore } from '../../../stores/sales/forecast.store'
import type { Forecast } from '../../../types/sales/forecast'
import ForecastAddModal from './components/ForecastAddModal.vue'
import ForecastDetailPanel from './components/ForecastDetailPanel.vue'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import { useAppToast } from '../../../composables/useAppToast'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

// Store
const store = useForecastStore()
const router = useRouter()
const { loading, meta, forecasts } = storeToRefs(store)
const { toastSuccess, toastError } = useAppToast()

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Sales' },
  { label: 'Forecast' }
]

// ─── Left Panel: List ────────────────────────────────────────────────────────
const searchFilter = ref('')
const customerFilter = ref<number | undefined>(undefined)
const forecastTypeFilter = ref<string | undefined>(undefined)
const statusFilter = ref<string | undefined>(undefined)

const customerItems = computed(() => store.customersDropdown.map(c => c.name))
const selectedCustomer = computed({
  get: () => store.customersDropdown.find(c => c.id === customerFilter.value)?.name,
  set: (val) => {
    customerFilter.value = store.customersDropdown.find(c => c.name === val)?.id
  }
})

const forecastTypeItems = computed(() => store.forecastTypesDropdown)
const selectedForecastType = computed({
  get: () => forecastTypeFilter.value,
  set: (val) => { forecastTypeFilter.value = val }
})

const statusItems = computed(() => store.statusDropdown)
const selectedStatus = computed({
  get: () => statusFilter.value,
  set: (val) => { statusFilter.value = val }
})

function fetchData() {
  store.fetchForecasts({
    page: meta.value.page,
    limit: meta.value.limit,
    search: searchFilter.value,
    customer_id: customerFilter.value,
    forecast_type: forecastTypeFilter.value,
    status: statusFilter.value
  })
}

function formatPeriodDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('default', { month: 'short', year: 'numeric' })
}

const debouncedSearch = useDebounceFn(() => {
  meta.value.page = 1
  fetchData()
}, 300)

watch(searchFilter, debouncedSearch)
watch([customerFilter, forecastTypeFilter, statusFilter], () => {
  meta.value.page = 1
  fetchData()
})

// ─── Right Panel: Selected Forecast ─────────────────────────────────────────
const selectedForecastId = ref<number | null>(null)
const detailPanelRef = ref<any>(null)

const selectedForecastData = computed(() =>
  forecasts.value.find(f => f.id === selectedForecastId.value) ?? null
)

function selectForecast(forecast: Forecast) {
  if (selectedForecastId.value === forecast.id) return

  if (detailPanelRef.value?.isDirty) {
    confirmDialog.value = {
      open: true,
      title: 'Unsaved Changes',
      description: 'You have unsaved changes in the current forecast',
      id: forecast.id,
      action: 'switch'
    }
    return
  }
  selectedForecastId.value = forecast.id
}

function getStatusColor(status: string): any {
  const map: Record<string, string> = {
    Draft: 'neutral',
    Submitted: 'warning',
    Approved: 'success',
    Rejected: 'error'
  }
  return map[status] || 'neutral'
}

// ─── Grouped List (status → customer) ───────────────────────────────────────
interface GroupedForecast {
  status: string
  customers: {
    customer: string
    customer_id: number
    items: Forecast[]
  }[]
}

const STATUS_ORDER = ['Draft', 'Submitted', 'Approved', 'Rejected']

const groupedForecasts = computed<GroupedForecast[]>(() => {
  const map = new Map<string, GroupedForecast>()

  forecasts.value.forEach(f => {
    const status = f.status
    if (!map.has(status)) {
      map.set(status, {
        status: status,
        customers: []
      })
    }
    const group = map.get(status)!
    const cid = f.customer_id
    let customerGroup = group.customers.find(c => c.customer_id === cid)
    if (!customerGroup) {
      customerGroup = {
        customer: f.customer?.name || `Customer #${cid}`,
        customer_id: cid,
        items: []
      }
      group.customers.push(customerGroup)
    }
    customerGroup.items.push(f)
  })

  // Sort groups by STATUS_ORDER
  const result = Array.from(map.values()).sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))

  // Sort customers within each status group
  result.forEach(g => {
    g.customers.sort((a, b) => a.customer.localeCompare(b.customer))
  })

  return result
})

// ─── Navigation Guards ───────────────────────────────────────────────────────
const isLeavingPage = ref(false)
const leaveToPath = ref('')

onBeforeRouteLeave((to, _from, next) => {
  if (isLeavingPage.value) {
    next()
    return
  }

  if (detailPanelRef.value?.isDirty) {
    leaveToPath.value = to.fullPath
    confirmDialog.value = {
      open: true,
      title: 'Unsaved Changes',
      description: 'You have unsaved changes. Are you sure you want to leave this page? Changes will be lost.',
      id: 0,
      action: 'leave'
    }
    next(false)
  } else {
    next()
  }
})

// Browser refresh/close guard
function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (detailPanelRef.value?.isDirty) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// ─── Collapse State ──────────────────────────────────────────────────────────
const collapsedStatuses = reactive<Record<string, boolean>>({})
const collapsedCustomers = reactive<Record<string, boolean>>({})

function toggleStatusCollapse(status: string) {
  collapsedStatuses[status] = !collapsedStatuses[status]
}

function toggleCustomerCollapse(status: string, customerId: number) {
  const key = `${status}-${customerId}`
  collapsedCustomers[key] = !collapsedCustomers[key]
}

// ─── Modal: Add / Edit ───────────────────────────────────────────────────────
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const currentForecast = reactive<Partial<Forecast>>({})

function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentForecast, {
    customer_id: undefined,
    forecast_type: '',
    start_period: '',
    end_period: '',
    description: ''
  })
  isModalOpen.value = true
}

function openEditModal(forecast: Forecast) {
  modalMode.value = 'edit'
  Object.assign(currentForecast, forecast)
  isModalOpen.value = true
}

async function handleSave(data: Partial<Forecast>) {
  try {
    if (modalMode.value === 'add') {
      const res = await store.createForecast(data)
      // Show period calculated by BE in confirmation
      const created = res?.data
      const periodInfo = created?.start_period && created?.end_period
        ? ` (${created.start_period} → ${created.end_period})`
        : ''
      toastSuccess(`Forecast ${created?.forecast_number || ''} created${periodInfo}`)
    } else {
      await store.updateForecast(currentForecast.id!, data)
      toastSuccess('Forecast updated successfully')
    }
    isModalOpen.value = false
    fetchData()
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Delete ──────────────────────────────────────────────────────────────────
const confirmDialog = ref({
  open: false,
  title: '',
  description: '',
  id: 0,
  action: 'delete' as 'delete' | 'switch' | 'leave'
})

function handleDelete(id: number) {
  confirmDialog.value = {
    open: true,
    title: 'Delete Forecast',
    description: 'Are you sure you want to delete this forecast? This action cannot be undone.',
    id,
    action: 'delete'
  }
}

function handleConfirm() {
  if (confirmDialog.value.action === 'delete') {
    executeDelete()
  } else if (confirmDialog.value.action === 'leave') {
    isLeavingPage.value = true
    confirmDialog.value.open = false
    router.push(leaveToPath.value)
  } else {
    // Discard & Switch
    detailPanelRef.value?.resetDirty()
    selectedForecastId.value = confirmDialog.value.id
    confirmDialog.value.open = false
  }
}

async function executeDelete() {
  try {
    await store.deleteForecast(confirmDialog.value.id)
    toastSuccess('Forecast deleted successfully')
    if (selectedForecastId.value === confirmDialog.value.id) {
      selectedForecastId.value = null
    }
    fetchData()
    confirmDialog.value.open = false
  } catch (e: any) {
    toastError(e)
    confirmDialog.value.open = false
  }
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(() => {
  store.fetchDropdownCustomers()
  store.fetchDropdownForecastTypes()
  store.fetchDropdownStatus()
  fetchData()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Breadcrumbs & Header -->
    <div class="px-6 pt-6 pb-4 border-b border-default space-y-3 shrink-0">
      <Breadcrumbs :items="breadcrumbItems" />
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">
          Sales Forecast
        </h1>
        <UButton
          icon="i-lucide-plus"
          color="primary"
          label="Add Forecast"
          @click="openAddModal"
        />
      </div>
    </div>

    <!-- Master-Detail Body -->
    <div class="flex flex-1 overflow-hidden min-h-0">
      <!-- ── Left Panel: List (30%) ── -->
      <div class="w-[30%] min-w-[260px] max-w-sm flex flex-col border-r border-default overflow-hidden">
        <!-- Filters -->
        <div class="p-3 space-y-2 border-b border-default shrink-0">
          <UInput
            v-model="searchFilter"
            icon="i-lucide-search"
            placeholder="Search forecast..."
            class="w-full"
            size="sm"
          />
          <div class="flex gap-2">
            <USelectMenu
              v-model="selectedCustomer"
              :items="customerItems"
              placeholder="Customer"
              class="flex-1"
              size="sm"
              clear
            />
            <USelectMenu
              v-model="selectedForecastType"
              :items="forecastTypeItems"
              placeholder="Type"
              class="w-28"
              size="sm"
              clear
            />
          </div>
          <USelectMenu
            v-model="selectedStatus"
            :items="statusItems"
            placeholder="All Status"
            class="w-full"
            size="sm"
            clear
          />
        </div>

        <!-- List -->
        <div class="flex-1 overflow-y-auto">
          <template v-if="groupedForecasts.length === 0">
            <div class="p-6 text-center text-sm text-muted">
              No forecasts found.
            </div>
          </template>

          <template v-for="statusGroup in groupedForecasts" :key="statusGroup.status">
            <!-- Status Group Header -->
            <div
              class="sticky top-0 z-10 px-3 py-2 bg-default/95 backdrop-blur border-b border-default flex items-center gap-2 cursor-pointer hover:bg-default/80 transition-colors"
              @click="toggleStatusCollapse(statusGroup.status)"
            >
              <UIcon
                :name="collapsedStatuses[statusGroup.status] ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
                class="w-4 h-4 text-muted transition-transform"
              />
              <UBadge :color="getStatusColor(statusGroup.status)" variant="subtle" size="xs">
                {{ statusGroup.status }}
              </UBadge>
              <span class="ml-auto text-xs text-muted shrink-0">{{ statusGroup.customers.reduce((n, c) => n + c.items.length, 0) }}</span>
            </div>

            <div v-show="!collapsedStatuses[statusGroup.status]">
              <template v-for="customerGroup in statusGroup.customers" :key="customerGroup.customer_id">
                <!-- Customer Sub-Header -->
                <div
                  class="px-3 py-1.5 border-b border-default/60 flex items-center gap-2 bg-elevated/30 cursor-pointer hover:bg-elevated/50 transition-colors"
                  @click="toggleCustomerCollapse(statusGroup.status, customerGroup.customer_id)"
                >
                  <UIcon
                    :name="collapsedCustomers[`${statusGroup.status}-${customerGroup.customer_id}`] ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
                    class="w-3.5 h-3.5 text-muted transition-transform"
                  />
                  <UIcon name="i-lucide-building-2" class="w-3.5 h-3.5 text-muted shrink-0" />
                  <span class="text-xs font-bold text-highlighted truncate">{{ customerGroup.customer }}</span>
                  <span class="text-xs text-muted ml-auto">{{ customerGroup.items.length }} item(s)</span>
                </div>

                <!-- Forecast Items -->
                <div v-show="!collapsedCustomers[`${statusGroup.status}-${customerGroup.customer_id}`]">
                  <button
                    v-for="forecast in customerGroup.items"
                    :key="forecast.id"
                    class="w-full text-left px-4 py-2.5 border-b border-default/40 hover:bg-elevated/60 transition-colors relative"
                    :class="{ 'bg-primary/10 border-l-2 border-l-primary': selectedForecastId === forecast.id }"
                    @click="selectForecast(forecast)"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium truncate">
                          {{ forecast.forecast_number }}
                        </p>
                        <p class="text-xs text-muted">
                          <UIcon name="i-lucide-calendar" class="w-3 h-3 inline" />
                          {{ formatPeriodDate(forecast.start_period) }} — {{ formatPeriodDate(forecast.end_period) }}
                        </p>
                      </div>
                      <span class="text-xs text-muted shrink-0">{{ forecast.forecast_type }}</span>
                    </div>
                  </button>
                </div>
              </template>
            </div>
          </template>
        </div>

        <!-- Pagination -->
        <div class="p-3 border-t border-default shrink-0">
          <div class="text-xs text-muted mb-2">
            {{ meta.total }} forecast(s)
          </div>
          <UPagination
            v-model:page="meta.page"
            :items-per-page="meta.limit"
            :total="meta.total"
            size="xs"
            @update:page="fetchData"
          />
        </div>
      </div>

      <!-- ── Right Panel: Detail (70%) ── -->
      <div class="flex-1 overflow-hidden">
        <div v-if="!selectedForecastId" class="flex flex-col items-center justify-center h-full text-muted gap-3">
          <UIcon name="i-lucide-file-search" class="w-12 h-12 opacity-30" />
          <p class="text-sm">
            Select a forecast from the list to view its detail
          </p>
        </div>

        <ForecastDetailPanel
          v-if="selectedForecastId"
          ref="detailPanelRef"
          :forecast-id="selectedForecastId"
          :forecast-summary="selectedForecastData"
          @edit="openEditModal"
          @delete="handleDelete"
          @refresh-list="fetchData"
        />
      </div>
    </div>

    <!-- Modal -->
    <ForecastAddModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :forecast="currentForecast"
      :loading="loading"
      @save="handleSave"
    />

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-model:open="confirmDialog.open"
      :title="confirmDialog.title"
      :description="confirmDialog.description"
      :confirm-label="confirmDialog.action === 'delete' ? 'Delete' : 'Discard & Switch'"
      :loading="loading"
      @confirm="handleConfirm"
    />
  </div>
</template>
