<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useColorMode } from '@vueuse/core'
import { useSalesAnalyticsStore } from '../../../../stores/sales/analytics.store'
import { defineAsyncComponent } from 'vue'
const apexchart = defineAsyncComponent(() => import('vue3-apexcharts'))

defineProps<{
  startDate: string
  endDate: string
}>()

const salesAnalyticsStore = useSalesAnalyticsStore()
const { sprAnalytics, loading } = storeToRefs(salesAnalyticsStore)

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const rejectionRate = computed(() => sprAnalytics.value?.kpis.rejection_rate ?? 0)

// Chart configuration
const chartBaseOptions = computed(() => {
  const textColor = isDark.value ? '#e4e4e7' : '#3f3f46'
  const borderColor = isDark.value ? '#27272a' : '#e2e8f0'
  const axisColor = isDark.value ? '#3f3f46' : '#cbd5e1'
  const legendColor = isDark.value ? '#f4f4f5' : '#1f2937'

  return {
    theme: { mode: isDark.value ? 'dark' : 'light' as const },
    chart: {
      background: 'transparent',
      foreColor: textColor,
      toolbar: { show: false }
    },
    grid: { borderColor },
    tooltip: { theme: isDark.value ? 'dark' : 'light' },
    xaxis: {
      labels: { style: { colors: textColor } },
      axisBorder: { color: axisColor },
      axisTicks: { color: axisColor }
    },
    yaxis: {
      labels: { style: { colors: textColor } }
    },
    legend: {
      labels: {
        colors: legendColor
      }
    }
  }
})

// Donut Chart: Status Breakdown
const donutChartOptions = computed(() => ({
  ...chartBaseOptions.value,
  chart: {
    ...chartBaseOptions.value.chart,
    type: 'donut'
  },
  labels: ['Draft', 'Submitted', 'Approved', 'Rejected'],
  colors: ['#64748b', '#f59e0b', '#10b981', '#ef4444'], // Slate, Amber, Emerald, Red
  legend: {
    position: 'bottom',
    labels: { colors: isDark.value ? '#e4e4e7' : '#3f3f46' }
  },
  stroke: {
    show: true,
    colors: [isDark.value ? '#18181b' : '#ffffff'],
    width: 2
  },
  dataLabels: {
    enabled: true,
    formatter: (_val: number, opts: any) => {
      return opts.w.config.series[opts.seriesIndex]
    }
  }
}))

const donutChartSeries = computed(() => {
  const data = sprAnalytics.value?.status_breakdown
  return [
    data?.Draft ?? 0,
    data?.Submitted ?? 0,
    data?.Approved ?? 0,
    data?.Rejected ?? 0
  ]
})

// Bar Chart: Pipeline Funnel
const funnelChartOptions = computed(() => ({
  ...chartBaseOptions.value,
  chart: {
    ...chartBaseOptions.value.chart,
    type: 'bar'
  },
  colors: ['#64748b', '#f59e0b', '#10b981', '#3b82f6'], // Slate, Amber, Emerald, Blue
  plotOptions: {
    bar: {
      horizontal: true,
      distributed: true,
      borderRadius: 4,
      barHeight: '80%',
      isFunnel: true
    }
  },
  dataLabels: {
    enabled: true,
    style: { colors: ['#fff'], fontSize: '11px', fontWeight: 'bold' },
    formatter: (val: number) => val.toLocaleString()
  },
  xaxis: {
    ...chartBaseOptions.value.xaxis,
    categories: sprAnalytics.value?.pipeline_funnel.map(r => r.stage) || []
  },
  legend: {
    show: false
  }
}))

const funnelChartSeries = computed(() => [
  {
    name: 'SPRs Count',
    data: sprAnalytics.value?.pipeline_funnel.map(r => Number(r.count || 0)) || []
  }
])
</script>

<template>
  <div class="space-y-6">
    <!-- Metric Cards Grid -->
    <div v-if="loading && !sprAnalytics" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard v-for="i in 2" :key="i">
        <div class="space-y-3">
          <USkeleton class="h-4 w-1/2" />
          <USkeleton class="h-8 w-3/4" />
          <USkeleton class="h-4 w-full" />
        </div>
      </UCard>
    </div>

    <div v-else-if="sprAnalytics" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- 1. SPR Status counts (like Delivery Orders Status) -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">SPR Status</span>
            <UIcon name="i-lucide-file-text" class="w-5 h-5 text-amber-500" />
          </div>
          <div class="grid grid-cols-2 gap-2 border-t border-default pt-3">
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Draft</span>
              <span class="text-sm font-bold text-muted">{{ sprAnalytics.status_breakdown.Draft || 0 }}</span>
            </div>
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Submitted</span>
              <span class="text-sm font-bold text-warning">{{ sprAnalytics.status_breakdown.Submitted || 0 }}</span>
            </div>
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Approved</span>
              <span class="text-sm font-bold text-success">{{ sprAnalytics.status_breakdown.Approved || 0 }}</span>
            </div>
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Rejected</span>
              <span class="text-sm font-bold text-error">{{ sprAnalytics.status_breakdown.Rejected || 0 }}</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- 2. SPR Rejection Rate -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">SPR Rejection Rate</span>
            <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ rejectionRate.toFixed(1) }}%
            </p>
            <p class="text-xs text-muted mt-1">
              Percentage of rejected SPRs out of total issued
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Charts Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Status Breakdown Donut Chart -->
      <UCard>
        <template #header>
          <div>
            <h3 class="font-semibold text-base">
              SPR Status Breakdown
            </h3>
            <p class="text-xs text-muted">
              Distribution of SPR documents by current status
            </p>
          </div>
        </template>

        <div v-if="loading && !sprAnalytics" class="h-[320px] flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <apexchart
          v-else-if="sprAnalytics && (donutChartSeries.reduce((a, b) => a + b, 0) > 0)"
          height="320"
          type="donut"
          :options="donutChartOptions"
          :series="donutChartSeries"
        />
        <div v-else class="h-[320px] flex items-center justify-center text-muted text-sm">
          No status breakdown data available for this range
        </div>
      </UCard>

      <!-- Pipeline Funnel Bar Chart -->
      <UCard>
        <template #header>
          <div>
            <h3 class="font-semibold text-base">
              Approval Pipeline Funnel
            </h3>
            <p class="text-xs text-muted">
              Conversion flow of SPRs from creation to SPO issuance
            </p>
          </div>
        </template>

        <div v-if="loading && !sprAnalytics" class="h-[320px] flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <apexchart
          v-else-if="sprAnalytics && sprAnalytics.pipeline_funnel.length"
          height="320"
          type="bar"
          :options="funnelChartOptions"
          :series="funnelChartSeries"
        />
        <div v-else class="h-[320px] flex items-center justify-center text-muted text-sm">
          No pipeline funnel data available for this range
        </div>
      </UCard>
    </div>
  </div>
</template>
