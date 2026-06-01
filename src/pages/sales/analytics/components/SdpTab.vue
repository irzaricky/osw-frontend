<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSalesAnalyticsStore } from '../../../../stores/sales/analytics.store'
import DockHeatmap from './DockHeatmap.vue'

defineProps<{
  startDate: string
  endDate: string
}>()

const salesAnalyticsStore = useSalesAnalyticsStore()
const { summary, loading } = storeToRefs(salesAnalyticsStore)

const totalDockHours = computed(() => {
  if (!summary.value?.dock_utilization) return '0.0'
  return summary.value.dock_utilization.reduce((acc, curr) => acc + curr.total_hours, 0).toFixed(1)
})
</script>

<template>
  <div class="space-y-6">
    <!-- KPI Metrics Grid -->
    <div v-if="loading && !summary" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard v-for="i in 2" :key="i">
        <div class="space-y-3">
          <USkeleton class="h-4 w-1/2" />
          <USkeleton class="h-8 w-3/4" />
          <USkeleton class="h-4 w-full" />
        </div>
      </UCard>
    </div>
    
    <div v-else-if="summary" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Active Shipment Plans -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Active Shipment Plans</span>
            <UIcon name="i-lucide-calendar" class="w-5 h-5 text-success" />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ summary.kpis.active_plans_count }}
            </p>
            <p class="text-xs text-muted mt-1">
              Schedules Pending / Draft
            </p>
          </div>
          <div class="border-t border-default pt-3 space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-muted">Total Plans:</span>
              <span class="font-semibold">{{ summary.kpis.total_plans_count }} SDP</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Dock Occupancy -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Dock Occupancy</span>
            <UIcon name="i-lucide-anchor" class="w-5 h-5 text-error" />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ totalDockHours }} hrs
            </p>
            <p class="text-xs text-muted mt-1">
              Total dock utilized hours
            </p>
          </div>
          <div class="border-t border-default pt-3 space-y-2 max-h-[80px] overflow-y-auto">
            <div v-for="dock in summary.dock_utilization" :key="dock.id" class="flex justify-between text-xs">
              <span class="text-muted">{{ dock.name }}:</span>
              <span class="font-semibold">{{ dock.total_hours.toFixed(1) }} hrs ({{ dock.plan_count }} plans)</span>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Dock Heatmap Section -->
    <DockHeatmap
      v-if="summary"
      :dock-utilization="summary.dock_utilization || []"
      :loading="loading"
    />
  </div>
</template>
