<script setup lang="ts">
 
import { onMounted, ref, watch, computed } from 'vue'
import { useSdoStore } from '../../../stores/sales/sdo.store'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import SdoKanbanColumn from './components/SdoKanbanColumn.vue'
import SdoDetailDrawer from './components/SdoDetailDrawer.vue'
import { storeToRefs } from 'pinia'
import type { Sdo } from '../../../types/sales/sdo'

const store = useSdoStore()
const { kanbanSdos } = storeToRefs(store)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Sales' },
  { label: 'Delivery Order (SDO)' }
]

// Global filters state
const searchQuery = ref('')
const selectedSdoId = ref<number | null>(null)
const isDrawerOpen = ref(false)

function loadKanbanBoard() {
  store.fetchKanbanByStatus('In Transit', { search: searchQuery.value }, false)
  store.fetchKanbanByStatus('Delivered', { search: searchQuery.value }, false)
}

onMounted(() => {
  loadKanbanBoard()
})

// Trigger reload on global search queries input
watch(
  searchQuery,
  () => {
    loadKanbanBoard()
  }
)

function onSdoSelect(sdo: Sdo) {
  selectedSdoId.value = sdo.id
  isDrawerOpen.value = true
}

// Compute dashboard overview stats
const stats = computed(() => {
  const inTransitCount = kanbanSdos.value['In Transit']?.length || 0
  const deliveredCount = kanbanSdos.value['Delivered']?.length || 0
  
  // Calculate total dispatched pieces & shortages
  let totalDispatched = 0
  let shortagesCount = 0
  
  if (kanbanSdos.value['Delivered']) {
    kanbanSdos.value['Delivered'].forEach(sdo => {
      if (sdo.details) {
        sdo.details.forEach(item => {
          totalDispatched += item.sent_qty
          const rec = item.received_qty ?? item.sent_qty
          if (rec < item.sent_qty) {
            shortagesCount += (item.sent_qty - rec)
          }
        })
      }
    })
  }

  if (kanbanSdos.value['In Transit']) {
    kanbanSdos.value['In Transit'].forEach(sdo => {
      if (sdo.details) {
        sdo.details.forEach(item => {
          totalDispatched += item.sent_qty
        })
      }
    })
  }

  return {
    inTransitCount,
    deliveredCount,
    totalDispatched,
    shortagesCount
  }
})
</script>

<template>
  <div class="flex flex-col h-full bg-slate-900/5 backdrop-blur-sm">
    <!-- Breadcrumbs & Header -->
    <div class="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800 space-y-3 shrink-0">
      <Breadcrumbs :items="breadcrumbItems" />
      <div class="flex justify-between items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            Sales Delivery Order (SDO) Kanban
          </h1>
          <p class="text-xs text-gray-500 mt-1">
            Dispatch shipments, generate official Surat Jalan PDFs, and track delivery fulfillments via a mobile-friendly Kanban board.
          </p>
        </div>
        
        <!-- Global Search input -->
        <div class="w-64">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Search SDO Number..."
            size="sm"
            class="w-full font-semibold"
            clearable
          />
        </div>
      </div>
    </div>

    <!-- Active State & Visual Dashboard Grid -->
    <div class="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col min-h-0">
      <!-- Metrics Overview Header Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <!-- Active Shipments -->
        <div class="bg-elevated/40 border border-default rounded-2xl p-4 flex items-center gap-4 backdrop-blur-sm shadow-sm relative overflow-hidden">
          <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />
          <div class="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <UIcon name="i-lucide-truck" class="w-6 h-6" />
          </div>
          <div>
            <span class="text-[10px] text-muted font-bold uppercase tracking-wider block">In Transit</span>
            <span class="text-xl font-black text-default leading-none">{{ stats.inTransitCount }} active</span>
          </div>
        </div>

        <!-- Confirmed Delivered -->
        <div class="bg-elevated/40 border border-default rounded-2xl p-4 flex items-center gap-4 backdrop-blur-sm shadow-sm relative overflow-hidden">
          <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
          <div class="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <UIcon name="i-lucide-shield-check" class="w-6 h-6" />
          </div>
          <div>
            <span class="text-[10px] text-muted font-bold uppercase tracking-wider block">Delivered</span>
            <span class="text-xl font-black text-default leading-none">{{ stats.deliveredCount }} complete</span>
          </div>
        </div>

        <!-- Total pcs dispatched -->
        <div class="bg-elevated/40 border border-default rounded-2xl p-4 flex items-center gap-4 backdrop-blur-sm shadow-sm relative overflow-hidden">
          <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-sky-500/5 rounded-full blur-xl" />
          <div class="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <UIcon name="i-lucide-box" class="w-6 h-6" />
          </div>
          <div>
            <span class="text-[10px] text-muted font-bold uppercase tracking-wider block">Dispatched pcs</span>
            <span class="text-xl font-black text-default leading-none font-mono">{{ stats.totalDispatched.toLocaleString() }}</span>
          </div>
        </div>

        <!-- Shortages items count -->
        <div class="bg-elevated/40 border border-default rounded-2xl p-4 flex items-center gap-4 backdrop-blur-sm shadow-sm relative overflow-hidden">
          <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-rose-500/5 rounded-full blur-xl" />
          <div class="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <UIcon name="i-lucide-alert-triangle" class="w-6 h-6" />
          </div>
          <div>
            <span class="text-[10px] text-muted font-bold uppercase tracking-wider block">Shortages logged</span>
            <span class="text-xl font-black font-mono text-default leading-none" :class="stats.shortagesCount > 0 ? 'text-rose-500 font-bold' : ''">
              {{ stats.shortagesCount.toLocaleString() }} pcs
            </span>
          </div>
        </div>
      </div>

      <!-- SDO Kanban Columns container -->
      <div class="flex-1 flex gap-6 overflow-x-auto min-h-0 pb-4 justify-start items-stretch">
        <SdoKanbanColumn
          status="In Transit"
          :search="searchQuery"
          @select="onSdoSelect"
        />

        <SdoKanbanColumn
          status="Delivered"
          :search="searchQuery"
          @select="onSdoSelect"
        />
      </div>
    </div>

    <!-- Active Details drawer slideover panel -->
    <SdoDetailDrawer
      v-model:open="isDrawerOpen"
      :sdo-id="selectedSdoId"
    />
  </div>
</template>

<style scoped>
/* Scoped layout rules */
</style>
