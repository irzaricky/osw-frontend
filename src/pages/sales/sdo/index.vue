<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { onMounted, ref, watch } from 'vue'
import { useSdoStore } from '../../../stores/sales/sdo.store'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import SdoDetailPanel from './components/SdoDetailPanel.vue'
import { storeToRefs } from 'pinia'
import type { Sdo } from '../../../types/sales/sdo'
import { useIntersectionObserver } from '@vueuse/core'

const store = useSdoStore()
const { sdos, loading, meta, detail } = storeToRefs(store)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Sales' },
  { label: 'Delivery Order (SDO)' }
]

// Global filters and selection state
const searchQuery = ref('')
const selectedSdoId = ref<number | null>(null)
const activeTab = ref<'all' | 'In Transit' | 'Delivered'>('all')
const sentinel = ref<HTMLElement | null>(null)

const tabs = [
  { label: 'All SDO', value: 'all' },
  { label: 'In Transit', value: 'In Transit' },
  { label: 'Delivered', value: 'Delivered' }
] as const

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
  selectedSdoId.value = null
  store.detail = null
  fetchData(false)
}

onMounted(async () => {
  await fetchStats()
  await fetchData(false)
})

// Trigger reload on global search queries
watch(searchQuery, () => {
  selectedSdoId.value = null
  store.detail = null
  fetchData(false)
})

// Master-detail click handler
async function selectSdo(sdo: Sdo) {
  selectedSdoId.value = sdo.id
  await store.fetchSdoById(sdo.id)
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
function getFulfillmentMetrics(sdo: Sdo) {
  if (!sdo.details || sdo.details.length === 0) return { totalSent: 0, totalReceived: 0, ratio: 0, shortages: 0 }
  const totalSent = sdo.details.reduce((acc, curr) => acc + curr.sent_qty, 0)
  const totalReceived = sdo.details.reduce((acc, curr) => acc + (curr.received_qty ?? curr.sent_qty), 0)
  const shortages = totalSent - totalReceived
  const ratio = totalSent > 0 ? (totalReceived / totalSent) * 100 : 0
  return { totalSent, totalReceived, ratio, shortages }
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="flex flex-col h-full">
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
    <div class="flex-1 flex overflow-hidden">
      <!-- Left side: List and Metrics -->
      <div class="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
        <!-- Master List Container Panel -->
        <div class="bg-elevated border border-default rounded-2xl flex flex-col flex-1 min-h-[400px] overflow-hidden">
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
            <div class="flex border border-default rounded-xl p-1 bg-default/40 shrink-0 w-80">
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

          <!-- SDO List Elements -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            <!-- Loading Indicator -->
            <div v-if="loading && sdos.length === 0" class="flex-1 flex items-center justify-center p-12 text-center">
              <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
            </div>

            <!-- Empty List State -->
            <div v-else-if="sdos.length === 0" class="flex-1 flex flex-col items-center justify-center p-12 text-center gap-3">
              <div class="w-16 h-16 bg-default rounded-full flex items-center justify-center text-muted mb-2">
                <UIcon name="i-lucide-inbox" class="w-8 h-8 text-default" />
              </div>
              <div>
                <h3 class="font-bold text-default text-lg">
                  No Delivery Orders Found
                </h3>
              </div>
            </div>

            <!-- Master Grid Cards -->
            <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div
                v-for="sdo in sdos"
                :key="sdo.id"
                class="bg-default rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden p-4 flex flex-col justify-between h-[160px] hover:shadow-lg relative"
                :class="selectedSdoId === sdo.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-default'"
                @click="selectSdo(sdo)"
              >
                <!-- Selection Highlight Side Bar -->
                <div v-if="selectedSdoId === sdo.id" class="absolute left-0 top-0 bottom-0 w-1 bg-primary" />

                <!-- Top Row Info -->
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-mono font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">
                      {{ sdo.do_number }}
                    </span>
                    <UBadge
                      :color="sdo.delivery_status === 'Delivered' ? 'success' : 'warning'"
                      variant="subtle"
                      size="xs"
                      class="rounded-full font-bold"
                    >
                      {{ sdo.delivery_status }}
                    </UBadge>
                  </div>
                  <h4 class="text-sm font-bold text-default leading-relaxed mt-1.5 truncate">
                    {{ sdo.customer?.name || '-' }}
                  </h4>
                </div>

                <!-- Metrics and short info -->
                <div class="mt-3 pt-3 border-t border-default/50 flex items-center justify-between text-xs text-muted-foreground">
                  <div class="flex items-center gap-1">
                    <UIcon name="i-lucide-package" class="w-3.5 h-3.5 text-muted shrink-0" />
                    <span class="text-[10px] font-bold text-default">
                      {{ getFulfillmentMetrics(sdo).totalSent }} pcs
                    </span>
                  </div>
                  <div class="text-[10px]">
                    Shipped: {{ formatDate(sdo.shipment_date) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Sentinel element for Infinite Scroll pagination loading -->
            <div ref="sentinel" class="h-10 w-full flex items-center justify-center">
              <UIcon v-if="loading" name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-primary/50" />
            </div>
          </div>
        </div>
      </div>

      <!-- Right side: Master-Detail Panel Info -->
      <div class="w-[400px] shrink-0 border-l border-default bg-elevated/40 h-full">
        <SdoDetailPanel
          :sdo="detail"
          :loading="loading"
          @close="selectedSdoId = null; store.detail = null"
          @refresh="fetchStats(); fetchData(false)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Redesigned layout styles */
</style>
