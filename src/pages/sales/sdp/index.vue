<script setup lang="ts">
import { onMounted } from 'vue'
import { useSdpStore } from '../../../stores/sales/sdp.store'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import { storeToRefs } from 'pinia'

const store = useSdpStore()
const { loading, plans, meta } = storeToRefs(store)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Sales' },
  { label: 'Delivery Plan (SDP)' }
]

onMounted(() => {
  store.fetchSdpPlans()
})
</script>

<template>
  <div class="flex flex-col h-full bg-slate-900/5 backdrop-blur-sm">
    <!-- Breadcrumbs & Header -->
    <div class="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800 space-y-3 shrink-0">
      <Breadcrumbs :items="breadcrumbItems" />
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
            Sales Delivery Plan (SDP)
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            Schedule logistics plans, consolidate warehouse destinations, and eliminate loading dock conflicts.
          </p>
        </div>
        <UButton
          icon="i-lucide-plus"
          color="primary"
          variant="solid"
          label="New Scheduling Plan"
          disabled
        />
      </div>
    </div>

    <!-- Active State & Visual Shell -->
    <div class="flex-1 p-6 overflow-y-auto space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Metric Card 1 -->
        <div class="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div class="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-blue-500">
            <UIcon name="i-lucide-calendar" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-sm text-gray-400 font-medium">
              Total Plans
            </p>
            <h3 class="text-2xl font-bold mt-0.5 text-gray-800 dark:text-gray-100">
              {{ meta.total }}
            </h3>
          </div>
        </div>

        <!-- Metric Card 2 -->
        <div class="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div class="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-500">
            <UIcon name="i-lucide-clock" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-sm text-gray-400 font-medium">
              Pending Schedules
            </p>
            <h3 class="text-2xl font-bold mt-0.5 text-gray-800 dark:text-gray-100">
              0
            </h3>
          </div>
        </div>

        <!-- Metric Card 3 -->
        <div class="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div class="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-emerald-500">
            <UIcon name="i-lucide-shield-check" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-sm text-gray-400 font-medium">
              Dock Slot Conflicts
            </p>
            <h3 class="text-2xl font-bold mt-0.5 text-emerald-500">
              0 Overlaps
            </h3>
          </div>
        </div>
      </div>

      <!-- Main Workspace Section -->
      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 class="font-semibold text-lg text-gray-800 dark:text-gray-100">
            Plan Board
          </h2>
          <UBadge color="primary" variant="subtle" size="xs">
            Phase 1 Active Store
          </UBadge>
        </div>

        <!-- Empty state with Pinia check -->
        <div class="flex flex-col items-center justify-center p-12 text-center text-gray-500 gap-4">
          <div class="relative">
            <div class="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl" />
            <UIcon name="i-lucide-calendar-days" class="w-16 h-16 text-indigo-500 relative animate-pulse" />
          </div>
          <div>
            <h3 class="font-bold text-gray-800 dark:text-gray-100 text-lg">
              Planning Subsystem Foundation Active
            </h3>
            <p class="text-sm text-gray-400 mt-1 max-w-md mx-auto">
              Axios request service layer and Pinia state management loaded successfully. Ready to build scheduler interface.
            </p>
          </div>
          <div class="flex items-center gap-2 mt-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-950/50 rounded-lg border border-gray-100 dark:border-gray-800 text-xs">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span class="font-mono text-gray-400">Store connected (plans: {{ plans.length }} items, loading: {{ loading }})</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
