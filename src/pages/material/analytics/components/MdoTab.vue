<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMaterialAnalyticsStore } from '../../../../stores/material/analytics.store'
import DockUtilizationCard from './DockCard.vue'
import VehiclePerformanceTable from './VehicleTab.vue'

defineProps<{
  startDate: string
  endDate: string
}>()

const materialAnalyticsStore = useMaterialAnalyticsStore()
const { mdoAnalytics, loading } = storeToRefs(materialAnalyticsStore)

const avgCapacityPct = computed(() => mdoAnalytics.value?.kpis.avg_capacity_usage_pct ?? 0)
const missingWeightCount = computed(() => mdoAnalytics.value?.kpis.missing_weight_count ?? 0)

const capacityColor = computed(() => {
  const v = avgCapacityPct.value
  if (v >= 90) return 'error'
  if (v >= 70) return 'success'
  return 'warning'
})
</script>

<template>
  <div class="space-y-6">
    <!-- Loading Skeleton -->
    <div v-if="loading && !mdoAnalytics" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard v-for="i in 3" :key="i">
        <div class="space-y-3">
          <USkeleton class="h-4 w-1/2" />
          <USkeleton class="h-8 w-3/4" />
          <USkeleton class="h-4 w-full" />
        </div>
      </UCard>
    </div>

    <!-- KPI Cards -->
    <div v-else-if="mdoAnalytics" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 1. MDO Status -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">MDO Status</span>
            <UIcon name="i-lucide-truck" class="w-5 h-5 text-primary" />
          </div>
          <div class="grid grid-cols-2 gap-2 border-t border-default pt-3">
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Draft</span>
              <span class="text-sm font-bold text-muted">{{ mdoAnalytics.status_breakdown.draft || 0 }}</span>
            </div>
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Scheduled</span>
              <span class="text-sm font-bold text-warning">{{ mdoAnalytics.status_breakdown.scheduled || 0 }}</span>
            </div>
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">In Transit</span>
              <span class="text-sm font-bold text-info">{{ mdoAnalytics.status_breakdown.in_transit || 0 }}</span>
            </div>
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Arrived</span>
              <span class="text-sm font-bold text-success">{{ mdoAnalytics.status_breakdown.arrived || 0 }}</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- 2. Avg Capacity Usage -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Avg Vehicle Capacity Usage</span>
            <UIcon name="i-lucide-gauge" class="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ avgCapacityPct.toFixed(1) }}%
            </p>
            <p class="text-xs text-muted mt-1">
              Rata-rata pemakaian kapasitas angkut kendaraan
            </p>
          </div>
          <UProgress :model-value="avgCapacityPct" :color="capacityColor" class="mt-2" />
        </div>
      </UCard>

      <!-- 3. Missing Weight Warning -->
      <UCard
        class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        :class="missingWeightCount > 0 ? 'ring-1 ring-amber-500/40' : ''"
      >
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Data Integrity</span>
            <UIcon
              :name="missingWeightCount > 0 ? 'i-lucide-alert-triangle' : 'i-lucide-check-circle'"
              class="w-5 h-5"
              :class="missingWeightCount > 0 ? 'text-amber-500' : 'text-success-500'"
            />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ missingWeightCount }}
            </p>
            <p class="text-xs text-muted mt-1">
              Part tanpa data berat (weight) pada MDO di rentang ini — pengaruhi akurasi capacity usage
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Charts / Tables Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <DockUtilizationCard
        :dock-utilization="mdoAnalytics?.dock_utilization || []"
        :loading="loading"
      />
      <VehiclePerformanceTable
        :vehicles="mdoAnalytics?.vehicle_performance || []"
        :loading="loading"
      />
    </div>
  </div>
</template>