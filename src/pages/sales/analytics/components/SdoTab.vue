<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSalesAnalyticsStore } from '../../../../stores/sales/analytics.store'

import ForecastVsSpoChart from './ForecastVsSpoChart.vue'
import TopCustomersChart from './TopCustomersChart.vue'

const props = defineProps<{
  startDate: string
  endDate: string
}>()

const salesAnalyticsStore = useSalesAnalyticsStore()
const { sdoAnalytics, loading } = storeToRefs(salesAnalyticsStore)

async function fetchTabMetrics() {
  await salesAnalyticsStore.fetchSdoAnalytics({
    start_date: props.startDate,
    end_date: props.endDate
  })
}

// Fetch on mount
onMounted(() => {
  fetchTabMetrics()
})

// Watch for date range changes
watch(() => [props.startDate, props.endDate], () => {
  fetchTabMetrics()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Loading Skeleton Grid -->
    <div v-if="loading && !sdoAnalytics" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard v-for="i in 3" :key="i">
        <div class="space-y-3">
          <USkeleton class="h-4 w-1/2" />
          <USkeleton class="h-8 w-3/4" />
          <USkeleton class="h-4 w-full" />
        </div>
      </UCard>
    </div>

    <!-- KPI Metrics Grid -->
    <div v-else-if="sdoAnalytics" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 1. SPO Summary -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Sales Purchase Orders</span>
            <UIcon name="i-lucide-shopping-cart" class="w-5 h-5 text-primary" />
          </div>
          <div>
            <p class="text-3xl font-bold text-black">
              {{ sdoAnalytics.kpis.total_spos }}
            </p>
            <p class="text-xs text-muted mt-1">
              Dokumen SPO terbit
            </p>
          </div>
          <div class="border-t border-default pt-3 space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-muted">Ordered Items:</span>
              <span class="font-semibold text-black">{{ sdoAnalytics.kpis.total_ordered_qty }} pcs</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-muted">Shipped Items:</span>
              <span class="font-semibold text-black">{{ sdoAnalytics.kpis.total_sent_qty }} pcs</span>
            </div>
            <UProgress
              :model-value="sdoAnalytics.kpis.total_ordered_qty > 0 ? (sdoAnalytics.kpis.total_sent_qty / sdoAnalytics.kpis.total_ordered_qty) * 100 : 0"
              class="mt-2"
            />
          </div>
        </div>
      </UCard>

      <!-- 2. SDO Delivery Status counts -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Delivery Orders Status</span>
            <UIcon name="i-lucide-truck" class="w-5 h-5 text-warning" />
          </div>
          <div class="grid grid-cols-2 gap-2 border-t border-default pt-3">
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Delivered</span>
              <span class="text-sm font-bold text-success">{{ sdoAnalytics.sdo_status_counts.Delivered || 0 }}</span>
            </div>
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">In Transit</span>
              <span class="text-sm font-bold text-primary">{{ sdoAnalytics.sdo_status_counts['In Transit'] || 0 }}</span>
            </div>
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Loading</span>
              <span class="text-sm font-bold text-warning">{{ sdoAnalytics.sdo_status_counts.Loading || 0 }}</span>
            </div>
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Created</span>
              <span class="text-sm font-bold text-muted">{{ sdoAnalytics.sdo_status_counts.Created || 0 }}</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- 3. SLA Performance -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">SLA Performance</span>
            <UIcon name="i-lucide-timer" class="w-5 h-5 text-success" />
          </div>
          <div>
            <p class="text-3xl font-bold text-black">
              {{ (sdoAnalytics.kpis.on_time_rate * 100).toFixed(1) }}%
            </p>
            <p class="text-xs text-muted mt-1">
              On Time Rate (24h SLA)
            </p>
          </div>
          <div class="border-t border-default pt-3 space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-muted">On Time:</span>
              <span class="font-semibold text-success">{{ sdoAnalytics.kpis.on_time }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-muted">Delayed:</span>
              <span class="font-semibold text-error">{{ sdoAnalytics.kpis.delayed }}</span>
            </div>
            <UProgress
              :model-value="sdoAnalytics.kpis.on_time_rate * 100"
              color="success"
              class="mt-2"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Charts Grid (Forecast vs SPO & Top Customers) -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <ForecastVsSpoChart
        v-if="sdoAnalytics?.forecast_vs_spo?.length"
        :forecast-vs-spo="sdoAnalytics.forecast_vs_spo"
        :loading="loading"
      />
      <TopCustomersChart
        v-if="sdoAnalytics?.top_customers?.length"
        :top-customers="sdoAnalytics.top_customers"
        :loading="loading"
      />
    </div>
  </div>
</template>
