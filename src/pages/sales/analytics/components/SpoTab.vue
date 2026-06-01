<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useColorMode } from '@vueuse/core'
import { useSalesAnalyticsStore } from '../../../../stores/sales/analytics.store'

defineProps<{
  startDate: string
  endDate: string
}>()

const salesAnalyticsStore = useSalesAnalyticsStore()
const { spoAnalytics, loading } = storeToRefs(salesAnalyticsStore)

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

// KPI data
const totalOrdered = computed(() => spoAnalytics.value?.kpis.total_ordered_items ?? 0)
const fulfillmentRate = computed(() => spoAnalytics.value?.kpis.fulfillment_rate ?? 0)
const activeCustomers = computed(() => spoAnalytics.value?.kpis.active_customers ?? 0)

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
  labels: ['Draft', 'Submitted', 'Locked', 'Processing', 'Completed', 'Rejected'],
  colors: ['#64748b', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#ef4444'], // Slate, Amber, Violet, Blue, Emerald, Red
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
  const data = spoAnalytics.value?.status_breakdown
  return [
    data?.Draft ?? 0,
    data?.Submitted ?? 0,
    data?.Locked ?? 0,
    data?.Processing ?? 0,
    data?.Completed ?? 0,
    data?.Rejected ?? 0
  ]
})

// Bar Chart: Top Customers by Volume
const barChartOptions = computed(() => ({
  ...chartBaseOptions.value,
  chart: {
    ...chartBaseOptions.value.chart,
    type: 'bar'
  },
  colors: ['#8b5cf6'], // Violet
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 4,
      barHeight: '55%',
      dataLabels: { position: 'right' }
    }
  },
  dataLabels: {
    enabled: true,
    style: { colors: [isDark.value ? '#e4e4e7' : '#3f3f46'], fontSize: '11px' },
    formatter: (val: number) => val.toLocaleString()
  },
  xaxis: {
    ...chartBaseOptions.value.xaxis,
    categories: spoAnalytics.value?.top_customers.map(r => r.customer_name) || []
  }
}))

const barChartSeries = computed(() => [
  {
    name: 'Ordered Volume (pcs)',
    data: spoAnalytics.value?.top_customers.map(r => Number(r.total_ordered_qty || 0)) || []
  }
])

// Line/Area Chart: Monthly Trends (Ordered vs Sent)
const trendChartOptions = computed(() => ({
  ...chartBaseOptions.value,
  chart: {
    ...chartBaseOptions.value.chart,
    type: 'area'
  },
  stroke: {
    curve: 'smooth',
    width: 3
  },
  colors: ['#8b5cf6', '#10b981'], // Violet for ordered, Emerald for sent
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0.1,
      stops: [0, 90, 100]
    }
  },
  xaxis: {
    ...chartBaseOptions.value.xaxis,
    categories: spoAnalytics.value?.monthly_trends.map(r => r.month) || []
  }
}))

const trendChartSeries = computed(() => [
  {
    name: 'Ordered Qty',
    data: spoAnalytics.value?.monthly_trends.map(r => Number(r.ordered_qty || 0)) || []
  },
  {
    name: 'Sent Qty',
    data: spoAnalytics.value?.monthly_trends.map(r => Number(r.sent_qty || 0)) || []
  }
])
</script>

<template>
  <div class="space-y-6">
    <!-- Metric Cards Grid -->
    <div v-if="loading && !spoAnalytics" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard v-for="i in 3" :key="i">
        <div class="space-y-3">
          <USkeleton class="h-4 w-1/2" />
          <USkeleton class="h-8 w-3/4" />
          <USkeleton class="h-4 w-full" />
        </div>
      </UCard>
    </div>

    <div v-else-if="spoAnalytics" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 1. Total Ordered Items -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Total Ordered Items</span>
            <UIcon name="i-lucide-shopping-cart" class="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ totalOrdered.toLocaleString() }} pcs
            </p>
            <p class="text-xs text-muted mt-1">
              Inbound order volume (active SPOs)
            </p>
          </div>
        </div>
      </UCard>

      <!-- 2. Fulfillment Rate -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Fulfillment Rate</span>
            <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ fulfillmentRate.toFixed(1) }}%
            </p>
            <p class="text-xs text-muted mt-1">
              Ratio of sent vs ordered items (sent / ordered)
            </p>
          </div>
        </div>
      </UCard>

      <!-- 3. Active Customers -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Active Customers</span>
            <UIcon name="i-lucide-users" class="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ activeCustomers }} customers
            </p>
            <p class="text-xs text-muted mt-1">
              Number of transacting customers
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
              SPO Status Breakdown
            </h3>
            <p class="text-xs text-muted">
              Distribution of SPO documents by current status
            </p>
          </div>
        </template>

        <div v-if="loading && !spoAnalytics" class="h-[320px] flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <apexchart
          v-else-if="spoAnalytics && (donutChartSeries.reduce((a, b) => a + b, 0) > 0)"
          height="320"
          type="donut"
          :options="donutChartOptions"
          :series="donutChartSeries"
        />
        <div v-else class="h-[320px] flex items-center justify-center text-muted text-sm">
          No status breakdown data available for this range
        </div>
      </UCard>

      <!-- Top Customers Bar Chart -->
      <UCard>
        <template #header>
          <div>
            <h3 class="font-semibold text-base">
              Top Customers
            </h3>
            <p class="text-xs text-muted">
              Top 5 customers by total order volume (SPO)
            </p>
          </div>
        </template>

        <div v-if="loading && !spoAnalytics" class="h-[320px] flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <apexchart
          v-else-if="spoAnalytics && spoAnalytics.top_customers.length"
          height="320"
          type="bar"
          :options="barChartOptions"
          :series="barChartSeries"
        />
        <div v-else class="h-[320px] flex items-center justify-center text-muted text-sm">
          No customer data available for this range
        </div>
      </UCard>

      <!-- Monthly Trends Chart -->
      <UCard class="xl:col-span-2">
        <template #header>
          <div>
            <h3 class="font-semibold text-base">
              Monthly Order Trends
            </h3>
            <p class="text-xs text-muted">
              Comparison of monthly ordered vs sent volume
            </p>
          </div>
        </template>

        <div v-if="loading && !spoAnalytics" class="h-[320px] flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <apexchart
          v-else-if="spoAnalytics && spoAnalytics.monthly_trends.length"
          height="320"
          type="area"
          :options="trendChartOptions"
          :series="trendChartSeries"
        />
        <div v-else class="h-[320px] flex items-center justify-center text-muted text-sm">
          No trend data available for this range
        </div>
      </UCard>
    </div>
  </div>
</template>
