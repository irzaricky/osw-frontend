<script setup lang="ts">
import { onMounted } from 'vue'
import { useSdoStore } from '../../../stores/sales/sdo.store'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import { storeToRefs } from 'pinia'

const store = useSdoStore()
const { loading, sdos } = storeToRefs(store)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Sales' },
  { label: 'Delivery Order (SDO)' }
]

onMounted(() => {
  store.fetchSdos()
})
</script>

<template>
  <div class="flex flex-col h-full bg-slate-900/5 backdrop-blur-sm">
    <!-- Breadcrumbs & Header -->
    <div class="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800 space-y-3 shrink-0">
      <Breadcrumbs :items="breadcrumbItems" />
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            Sales Delivery Order (SDO)
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            Dispatch shipments, generate official Surat Jalan PDFs, and track deliveries via a Kanban workflow.
          </p>
        </div>
        <UButton
          icon="i-lucide-file-text"
          color="success"
          variant="solid"
          label="Print Active SDO"
          disabled
        />
      </div>
    </div>

    <!-- Active State & Visual Shell -->
    <div class="flex-1 p-6 overflow-y-auto space-y-6">
      <!-- Mock Kanban Columns -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
        <!-- In Transit Column -->
        <div class="bg-gray-50/50 dark:bg-gray-900/30 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col">
          <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 class="font-bold text-gray-700 dark:text-gray-200 text-sm">
                In Transit
              </h3>
            </div>
            <UBadge color="warning" variant="subtle" size="xs">
              Active
            </UBadge>
          </div>
          <div class="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <UIcon name="i-lucide-truck" class="w-10 h-10 opacity-30 mb-2" />
            <p class="text-xs">
              No active transit orders loaded in Kanban
            </p>
          </div>
        </div>

        <!-- Delivered Column -->
        <div class="bg-gray-50/50 dark:bg-gray-900/30 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col">
          <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 class="font-bold text-gray-700 dark:text-gray-200 text-sm">
                Delivered
              </h3>
            </div>
            <UBadge color="success" variant="subtle" size="xs">
              Confirmed
            </UBadge>
          </div>
          <div class="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <UIcon name="i-lucide-check-circle-2" class="w-10 h-10 opacity-30 mb-2" />
            <p class="text-xs">
              No delivered shipments loaded in Kanban
            </p>
          </div>
        </div>
      </div>

      <!-- Main Workspace Section -->
      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 class="font-semibold text-lg text-gray-800 dark:text-gray-100">
            Delivery Execution Board
          </h2>
          <UBadge color="success" variant="subtle" size="xs">
            Phase 1 Active Store
          </UBadge>
        </div>

        <!-- Empty state with Pinia check -->
        <div class="flex flex-col items-center justify-center p-12 text-center text-gray-500 gap-4">
          <div class="relative">
            <div class="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl" />
            <UIcon name="i-lucide-truck" class="w-16 h-16 text-emerald-500 relative" />
          </div>
          <div>
            <h3 class="font-bold text-gray-800 dark:text-gray-100 text-lg">
              Execution Subsystem Foundation Active
            </h3>
            <p class="text-sm text-gray-400 mt-1 max-w-md mx-auto">
              Axios service request mappings and Pinia store modules initialized successfully. Ready to build Kanban monitor board.
            </p>
          </div>
          <div class="flex items-center gap-2 mt-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-950/50 rounded-lg border border-gray-100 dark:border-gray-800 text-xs">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span class="font-mono text-gray-400">Store connected (sdos: {{ sdos.length }} items, loading: {{ loading }})</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
