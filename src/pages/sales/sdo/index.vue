<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { onMounted, ref, watch } from 'vue'
import { useSdoStore } from '../../../stores/sales/sdo.store'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import { storeToRefs } from 'pinia'
import type { Sdo } from '../../../types/sales/sdo'
import { useIntersectionObserver } from '@vueuse/core'
import { compressImage } from '../../../utils'
import { useAppToast } from '../../../composables/useAppToast'

const { toastSuccess, toastError } = useAppToast()

const store = useSdoStore()
const { sdos, loading, meta } = storeToRefs(store)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Sales' },
  { label: 'Delivery Order (SDO)' }
]

// Global filters and selection state
const searchQuery = ref('')
const activeTab = ref<'all' | 'In Transit' | 'Delivered'>('all')
const sentinel = ref<HTMLElement | null>(null)

const tabs = [
  { label: 'All SDO', value: 'all' },
  { label: 'In Transit', value: 'In Transit' },
  { label: 'Delivered', value: 'Delivered' }
] as const

// Expanded row state (Option A behavior)
const expandedSdoId = ref<number | null>(null)
const printingMap = ref<Record<number, boolean>>({})
const submittingPodMap = ref<Record<number, boolean>>({})

// POD form state
const podFile = ref<File | null>(null)
const podNotes = ref('')
const podFormDetails = ref<Record<number, number>>({}) // detail_id -> received_qty

// Stats computation properties
const stats = ref({
  inTransitCount: 0,
  deliveredCount: 0,
  totalDispatched: 0,
  shortagesCount: 0
})

async function fetchStats() {
  try {
    // Perform a background prefetch of recent SDOs to calculate dashboard metrics
    await store.fetchSdos({ limit: 100 })
    let inTransit = 0
    let delivered = 0
    let dispatched = 0
    let shortages = 0

    sdos.value.forEach(sdo => {
      if (sdo.delivery_status === 'In Transit') inTransit++
      if (sdo.delivery_status === 'Delivered') delivered++

      if (sdo.details) {
        sdo.details.forEach(item => {
          dispatched += item.sent_qty
          const rec = item.received_qty ?? item.sent_qty
          if (rec < item.sent_qty) {
            shortages += (item.sent_qty - rec)
          }
        })
      }
    })

    stats.value = {
      inTransitCount: inTransit,
      deliveredCount: delivered,
      totalDispatched: dispatched,
      shortagesCount: shortages
    }
  } catch (err) {
    console.error('Error fetching SDO stats:', err)
  }
}

async function fetchData(append = false) {
  const params: Record<string, any> = {
    page: append ? meta.value.page + 1 : 1,
    limit: meta.value.limit,
    search: searchQuery.value
  }
  if (activeTab.value !== 'all') {
    params.delivery_status = activeTab.value
  }

  const oldSdos = append ? sdos.value : []
  await store.fetchSdos(params)
  if (append) {
    sdos.value = [...oldSdos, ...sdos.value]
  }
}

function changeTab(tabVal: 'all' | 'In Transit' | 'Delivered') {
  activeTab.value = tabVal
  expandedSdoId.value = null
  store.detail = null
  fetchData(false)
}

onMounted(async () => {
  await fetchStats()
  await fetchData(false)
})

// Trigger reload on global search queries
watch(searchQuery, () => {
  expandedSdoId.value = null
  store.detail = null
  fetchData(false)
})

// Master-detail toggle expand logic (Option A)
async function toggleExpand(sdo: Sdo) {
  if (expandedSdoId.value === sdo.id) {
    expandedSdoId.value = null
    podFile.value = null
    podNotes.value = ''
    podFormDetails.value = {}
  } else {
    expandedSdoId.value = sdo.id
    podFile.value = null
    podNotes.value = ''
    podFormDetails.value = {}

    await store.fetchSdoById(sdo.id)

    // Initialize received_qty form values to sent_qty as default
    if (store.detail && store.detail.id === sdo.id && store.detail.details) {
      store.detail.details.forEach(item => {
        podFormDetails.value[item.id] = item.sent_qty
      })
    }
  }
}

async function handlePrint(sdoId: number) {
  printingMap.value[sdoId] = true
  try {
    await store.downloadSdoPdf(sdoId)
    // Reload data to reflect automatically updated Shipped status
    await fetchData(false)
    await fetchStats()
    await store.fetchSdoById(sdoId)
  } catch (error) {
    console.error('Error printing SDO PDF:', error)
  } finally {
    printingMap.value[sdoId] = false
  }
}

async function handlePodFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    podFile.value = await compressImage(file)
  }
}

async function submitPod(sdo: any) {
  if (!podFile.value) {
    toastError('Please upload a Proof of Delivery file.')
    return
  }

  // Construct details payload
  const detailsPayload = sdo.details.map((item: any) => ({
    delivery_order_detail_id: item.id,
    received_qty: podFormDetails.value[item.id] ?? item.sent_qty,
    notes: ''
  }))

  const formData = new FormData()
  formData.append('proof_of_delivery', podFile.value)
  formData.append('notes', podNotes.value)
  formData.append('details', JSON.stringify(detailsPayload))

  submittingPodMap.value[sdo.id] = true
  try {
    const res = await store.updateSdoStatus(sdo.id, formData)
    if (res.status) {
      podFile.value = null
      podNotes.value = ''
      podFormDetails.value = {}

      await fetchData(false)
      await fetchStats()

      expandedSdoId.value = null
      store.detail = null

      toastSuccess('Proof of Delivery confirmed successfully!')
    } else {
      toastError(res.message || 'Failed to confirm delivery.')
    }
  } catch (error: any) {
    console.error('Error submitting POD:', error)
    toastError(error.response?.data?.message || 'Error occurred while confirming delivery.')
  } finally {
    submittingPodMap.value[sdo.id] = false
  }
}

// Infinite Scroll Observer
useIntersectionObserver(
  sentinel,
  ([{ isIntersecting }]) => {
    if (isIntersecting && !loading.value && sdos.value.length > 0) {
      if (meta.value.page < meta.value.totalPages) {
        fetchData(true)
      }
    }
  },
  { threshold: 0.1 }
)

// Helper methods
function getStatusColor(status: string) {
  switch (status) {
    case 'In Transit':
      return 'warning'
    case 'Delivered':
      return 'success'
    default:
      return 'primary'
  }
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getSlaBadgeConfig(status?: string) {
  switch (status) {
    case 'Delayed':
      return { color: 'error' as const, icon: 'i-lucide-clock-alert', label: 'Delayed' }
    case 'Near Expiry':
      return { color: 'warning' as const, icon: 'i-lucide-alert-triangle', label: 'Near Expiry' }
    case 'On Time':
    default:
      return { color: 'success' as const, icon: 'i-lucide-check-circle', label: 'On Time' }
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-default/10">
    <!-- Breadcrumbs & Header -->
    <div class="px-6 pt-6 pb-4 border-b border-default space-y-3 shrink-0 bg-elevated/40">
      <Breadcrumbs :items="breadcrumbItems" />
      <div class="flex justify-between items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold">
            Sales Delivery Order (SDO)
          </h1>
        </div>
      </div>
    </div>

    <!-- Active State & Visual Dashboard Grid -->
    <div class="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
      <!-- Mini dashboard stats widgets -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-elevated border border-default rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span class="text-xs text-muted-foreground font-semibold">In Transit SDO</span>
          <span class="text-2xl font-black mt-2 text-warning">{{ stats.inTransitCount }}</span>
        </div>
        <div class="bg-elevated border border-default rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span class="text-xs text-muted-foreground font-semibold">Delivered SDO</span>
          <span class="text-2xl font-black mt-2 text-success">{{ stats.deliveredCount }}</span>
        </div>
        <div class="bg-elevated border border-default rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span class="text-xs text-muted-foreground font-semibold">Total Dispatched</span>
          <span class="text-2xl font-black mt-2 text-primary">{{ stats.totalDispatched }} pcs</span>
        </div>
      </div>

      <!-- Master List Container Panel -->
      <div class="bg-elevated border border-default rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <!-- Filter bar with tabs and search -->
        <div class="p-4 border-b border-default flex flex-wrap gap-4 items-center justify-between bg-elevated/40 shrink-0">
          <!-- Search SDO -->
          <div class="w-64 shrink-0">
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Search SDO Number..."
              size="sm"
              class="w-full"
              clearable
            />
          </div>

          <!-- Custom Tabs Filters -->
          <div class="flex border border-default rounded-xl p-1 bg-default/40 shrink-0 w-96">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
              :class="activeTab === tab.value ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:bg-default/60 hover:text-default'"
              @click="changeTab(tab.value)"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Master-Detail Table -->
        <div class="overflow-x-auto">
          <!-- Empty State -->
          <div v-if="sdos.length === 0 && !loading" class="flex flex-col items-center justify-center p-12 text-center gap-3">
            <div class="w-16 h-16 bg-default rounded-full flex items-center justify-center text-muted mb-2">
              <UIcon name="i-lucide-inbox" class="w-8 h-8 text-default" />
            </div>
            <div>
              <h3 class="font-bold text-default text-lg">No Delivery Orders Found</h3>
            </div>
          </div>

          <table v-else class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-default text-xs font-bold text-muted-foreground bg-default/40">
                <th class="p-4 w-12 text-center"></th>
                <th class="p-4">SDO Number</th>
                <th class="p-4">Customer Name</th>
                <th class="p-4">Shipment Date</th>
                <th class="p-4">Vehicle</th>
                <th class="p-4">Driver</th>
                <th class="p-4">Status</th>
                <th class="p-4">SLA Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default/40">
              <template v-for="sdo in sdos" :key="sdo.id">
                <!-- Master Row -->
                <tr
                  class="hover:bg-default/20 transition-colors cursor-pointer group"
                  :class="expandedSdoId === sdo.id ? 'bg-primary/5' : ''"
                  @click="toggleExpand(sdo)"
                >
                  <td class="p-4 text-center">
                    <UIcon
                      name="i-lucide-chevron-right"
                      class="w-4 h-4 text-muted transition-transform duration-300"
                      :class="expandedSdoId === sdo.id ? 'rotate-90 text-primary' : 'group-hover:text-default'"
                    />
                  </td>
                  <td class="p-4 font-mono font-bold text-primary text-xs">
                    {{ sdo.do_number }}
                  </td>
                  <td class="p-4 font-bold text-sm">
                    {{ sdo.customer?.name || '-' }}
                  </td>
                  <td class="p-4 text-xs text-muted-foreground">
                    {{ formatDate(sdo.shipment_date) }}
                  </td>
                  <td class="p-4 text-xs font-mono">
                    <span class="px-2 py-0.5 bg-default rounded border border-default">
                      {{ sdo.vehicle?.license_plate || '-' }}
                    </span>
                  </td>
                  <td class="p-4 text-xs">
                    {{ sdo.driver?.full_name || '-' }}
                  </td>
                  <td class="p-4">
                    <UBadge
                      :color="getStatusColor(sdo.delivery_status)"
                      variant="subtle"
                      size="xs"
                      class="rounded-full font-bold"
                    >
                      {{ sdo.delivery_status }}
                    </UBadge>
                  </td>
                  <td class="p-4">
                    <UBadge
                      :color="getSlaBadgeConfig(sdo.sla_status).color"
                      variant="subtle"
                      size="xs"
                      class="rounded-full font-bold"
                      :class="sdo.sla_status === 'Delayed' ? 'animate-pulse' : ''"
                    >
                      <UIcon :name="getSlaBadgeConfig(sdo.sla_status).icon" class="mr-1 w-3.5 h-3.5" />
                      {{ getSlaBadgeConfig(sdo.sla_status).label }}
                    </UBadge>
                  </td>
                </tr>

                <!-- Expanded Detail Area (Option A) -->
                <tr v-if="expandedSdoId === sdo.id">
                  <td colspan="8" class="p-6 bg-elevated/40 border-l-2 border-primary">
                    <!-- Loading Detail Spinner -->
                    <div v-if="loading && (!store.detail || store.detail.id !== sdo.id)" class="flex justify-center p-8">
                      <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-primary" />
                    </div>

                    <div v-else-if="store.detail && store.detail.id === sdo.id" class="space-y-6">
                      <!-- Grid container to put Shipment Details on the left and POD on the right if In Transit -->
                      <div :class="store.detail.delivery_status === 'In Transit' ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : 'space-y-6'">
                        <!-- Shipment Item Details (Left / Main side) -->
                        <div 
                          class="bg-elevated border border-default rounded-2xl p-5 shadow-sm space-y-4"
                          :class="store.detail.delivery_status === 'In Transit' ? 'lg:col-span-7' : ''"
                        >
                          <div class="flex items-center justify-between border-b border-default pb-3">
                            <h4 class="text-sm font-bold text-default flex items-center gap-2">
                              <UIcon name="i-lucide-package-open" class="w-4 h-4 text-primary" />
                              Shipment Item Details
                            </h4>
                            <div class="flex items-center gap-3">
                              <!-- Print PDF Surat Jalan -->
                              <UButton
                                icon="i-lucide-printer"
                                size="xs"
                                color="primary"
                                variant="solid"
                                :loading="printingMap[sdo.id]"
                                @click.stop="handlePrint(sdo.id)"
                              >
                                Print Surat Jalan
                              </UButton>
                            </div>
                          </div>

                          <!-- Sub-table of items -->
                          <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr class="border-b border-default text-muted-foreground font-semibold">
                                  <th class="pb-2 pr-4 w-12">No.</th>
                                  <th class="pb-2 pr-4">Part Number</th>
                                  <th class="pb-2 pr-4">Part Name</th>
                                  <th class="pb-2 pr-4 text-right">Planned Qty</th>
                                  <th class="pb-2 pr-4 text-right">Sent Qty</th>
                                  <th class="pb-2 text-right">Received Qty</th>
                                </tr>
                              </thead>
                              <tbody class="divide-y divide-default/10">
                                <tr v-for="(item, idx) in store.detail.details" :key="item.id" class="hover:bg-default/10">
                                  <td class="py-2 pr-4 text-muted-foreground">{{ idx + 1 }}</td>
                                  <td class="py-2 pr-4 font-mono font-semibold">{{ item.planDetail?.spoDetail?.part?.part_number || '-' }}</td>
                                  <td class="py-2 pr-4">{{ item.planDetail?.spoDetail?.part?.part_name || '-' }}</td>
                                  <td class="py-2 pr-4 text-right font-semibold text-muted-foreground">{{ item.planDetail?.planned_qty || 0 }} pcs</td>
                                  <td class="py-2 pr-4 text-right font-bold text-primary">{{ item.sent_qty }} pcs</td>
                                  <td class="py-2 text-right font-bold" :class="item.received_qty !== null ? 'text-success' : 'text-muted-foreground'">
                                    {{ item.received_qty !== null ? `${item.received_qty} pcs` : '-' }}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <!-- POD Confirm Form if SDO status is In Transit (Right side) -->
                        <div 
                          v-if="store.detail.delivery_status === 'In Transit'" 
                          class="bg-elevated border border-default rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-5"
                        >
                          <h4 class="text-sm font-bold text-default flex items-center gap-2 border-b border-default pb-3">
                            <UIcon name="i-lucide-file-check" class="w-4 h-4 text-success" />
                            Proof Of Delivery (POD) Confirmation
                          </h4>

                          <form @submit.prevent="submitPod(store.detail)" class="space-y-4">
                            <!-- Quantities Input -->
                            <div class="grid grid-cols-1 gap-4">
                              <div v-for="item in store.detail.details" :key="item.id" class="space-y-1.5">
                                <label class="text-xs font-semibold text-default block">
                                  Received Qty for: {{ item.planDetail?.spoDetail?.part?.part_name }} (Sent: {{ item.sent_qty }} pcs)
                                </label>
                                <UInput
                                  v-model.number="podFormDetails[item.id]"
                                  type="number"
                                  size="sm"
                                  min="0"
                                  :max="item.sent_qty"
                                  placeholder="Enter received quantity"
                                  required
                                  class="w-full"
                                />
                              </div>
                            </div>

                            <!-- File and Notes Column -->
                            <div class="grid grid-cols-1 gap-4 pt-2">
                              <div class="space-y-1.5">
                                <label class="text-xs font-semibold text-default block">Proof of Delivery File (Image/PDF)</label>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  required
                                  class="block w-full text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/95 cursor-pointer"
                                  @change="handlePodFileChange($event)"
                                />
                              </div>
                              <div class="space-y-1.5">
                                <label class="text-xs font-semibold text-default block">Notes</label>
                                <UInput
                                  v-model="podNotes"
                                  placeholder="Optional receipt notes..."
                                  size="sm"
                                  class="w-full"
                                />
                              </div>
                            </div>

                            <div class="flex justify-end gap-3 pt-3 border-t border-default/50">
                              <UButton
                                type="submit"
                                color="success"
                                variant="solid"
                                icon="i-lucide-check-circle"
                                size="sm"
                                :loading="submittingPodMap[store.detail.id]"
                              >
                                Confirm Delivery
                              </UButton>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Sentinel element for Infinite Scroll pagination loading -->
        <div ref="sentinel" class="h-10 w-full flex items-center justify-center">
          <UIcon v-if="loading" name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-primary/50" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Redesigned layout styles */
</style>

