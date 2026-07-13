<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useColorMode } from '@vueuse/core'
import { useMaterialAnalyticsStore } from '../../../../stores/material/analytics.store'
import { defineAsyncComponent } from 'vue'
const apexchart = defineAsyncComponent(() => import('vue3-apexcharts'))

defineProps<{
  startDate: string
  endDate: string
}>()

const materialAnalyticsStore = useMaterialAnalyticsStore()
const { mpoAnalytics, loading } = storeToRefs(materialAnalyticsStore)

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

function formatCurrency(val: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0)
}

const totalSpend = computed(() => mpoAnalytics.value?.kpis.total_spend ?? 0)
const avgOrderValue = computed(() => mpoAnalytics.value?.kpis.avg_order_value ?? 0)
const rejectionRate = computed(() => mpoAnalytics.value?.kpis.rejection_rate ?? 0)

// ─── Chart base options ───────────────────────────────────────────────────────
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
      labels: { colors: legendColor }
    }
  }
})

// ─── Donut: Status Breakdown ──────────────────────────────────────────────────
const statusDonutOptions = computed(() => ({
  ...chartBaseOptions.value,
  chart: { ...chartBaseOptions.value.chart, type: 'donut' },
  labels: ['Draft', 'Submitted', 'Approved', 'Rejected'],
  colors: ['#64748b', '#f59e0b', '#10b981', '#ef4444'],
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
    formatter: (_val: number, opts: any) => opts.w.config.series[opts.seriesIndex]
  }
}))

const statusDonutSeries = computed(() => {
  const d = mpoAnalytics.value?.status_breakdown
  return [d?.draft ?? 0, d?.submitted ?? 0, d?.approved ?? 0, d?.rejected ?? 0]
})

// ─── Bar: Top Suppliers by Spend ──────────────────────────────────────────────
const supplierBarOptions = computed(() => ({
  ...chartBaseOptions.value,
  chart: { ...chartBaseOptions.value.chart, type: 'bar' },
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
    formatter: (val: number) => formatCurrency(val)
  },
  grid: {
    ...chartBaseOptions.value.grid,
    padding: { right: 60 }
  },
  xaxis: {
    ...chartBaseOptions.value.xaxis,
    categories: mpoAnalytics.value?.top_suppliers.map(r => r.supplier_name || '-') || []
  },
  tooltip: {
    ...chartBaseOptions.value.tooltip,
    y: { formatter: (val: number) => formatCurrency(val) }
  }
}))

const supplierBarSeries = computed(() => [
  {
    name: 'Total Spend',
    data: mpoAnalytics.value?.top_suppliers.map(r => Number(r.total_spend || 0)) || []
  }
])

// ─── Area: Monthly Spend Trend ────────────────────────────────────────────────
const trendChartOptions = computed(() => ({
  ...chartBaseOptions.value,
  chart: { ...chartBaseOptions.value.chart, type: 'area' },
  stroke: { curve: 'smooth', width: 3 },
  colors: ['#8b5cf6'],
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1, stops: [0, 90, 100] }
  },
  xaxis: {
    ...chartBaseOptions.value.xaxis,
    categories: mpoAnalytics.value?.monthly_spend_trend.map(r => r.month) || []
  },
  yaxis: {
    ...chartBaseOptions.value.yaxis,
    labels: {
      style: { colors: isDark.value ? '#e4e4e7' : '#3f3f46' },
      formatter: (val: number) => formatCurrency(val)
    }
  },
  tooltip: {
    ...chartBaseOptions.value.tooltip,
    y: { formatter: (val: number) => formatCurrency(val) }
  }
}))

const trendChartSeries = computed(() => [
  {
    name: 'Spend',
    data: mpoAnalytics.value?.monthly_spend_trend.map(r => Number(r.spend || 0)) || []
  }
])
</script>

<template>
  <div class="space-y-6">
    <!-- Loading Skeleton -->
    <div v-if="loading && !mpoAnalytics" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard v-for="i in 3" :key="i">
        <div class="space-y-3">
          <USkeleton class="h-4 w-1/2" />
          <USkeleton class="h-8 w-3/4" />
          <USkeleton class="h-4 w-full" />
        </div>
      </UCard>
    </div>

    <!-- KPI Cards -->
    <div v-else-if="mpoAnalytics" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 1. Total Spend -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Total Purchase Spend</span>
            <UIcon name="i-lucide-wallet" class="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ formatCurrency(totalSpend) }}
            </p>
            <p class="text-xs text-muted mt-1">
              Total nilai {{ mpoAnalytics.kpis.total_orders }} dokumen MPO pada rentang ini
            </p>
          </div>
        </div>
      </UCard>

      <!-- 2. Avg Order Value -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Average Order Value</span>
            <UIcon name="i-lucide-receipt" class="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ formatCurrency(avgOrderValue) }}
            </p>
            <p class="text-xs text-muted mt-1">
              Rata-rata nilai per dokumen MPO
            </p>
          </div>
        </div>
      </UCard>

      <!-- 3. Rejection Rate -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">MPO Rejection Rate</span>
            <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ rejectionRate.toFixed(1) }}%
            </p>
            <p class="text-xs text-muted mt-1">
              Persentase MPO Rejected dari total Approved + Rejected
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Charts Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Status Breakdown Donut -->
      <UCard>
        <template #header>
          <div>
            <h3 class="font-semibold text-base">
              MPO Status Breakdown
            </h3>
            <p class="text-xs text-muted">
              Distribusi dokumen MPO berdasarkan status saat ini
            </p>
          </div>
        </template>

        <div v-if="loading && !mpoAnalytics" class="h-[320px] flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <apexchart
          v-else-if="mpoAnalytics && (statusDonutSeries.reduce((a, b) => a + b, 0) > 0)"
          height="320"
          type="donut"
          :options="statusDonutOptions"
          :series="statusDonutSeries"
        />
        <div v-else class="h-[320px] flex items-center justify-center text-muted text-sm">
          Belum ada data status pada rentang ini
        </div>
      </UCard>

      <!-- Top Suppliers by Spend -->
      <UCard>
        <template #header>
          <div>
            <h3 class="font-semibold text-base">
              Top Suppliers by Spend
            </h3>
            <p class="text-xs text-muted">
              Top 10 supplier dengan total nilai pembelian terbesar
            </p>
          </div>
        </template>

        <div v-if="loading && !mpoAnalytics" class="h-[320px] flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <apexchart
          v-else-if="mpoAnalytics && mpoAnalytics.top_suppliers.length"
          height="320"
          type="bar"
          :options="supplierBarOptions"
          :series="supplierBarSeries"
        />
        <div v-else class="h-[320px] flex items-center justify-center text-muted text-sm">
          Tidak ada data supplier pada rentang ini
        </div>
      </UCard>

      <!-- Monthly Spend Trend -->
      <UCard class="xl:col-span-2">
        <template #header>
          <div>
            <h3 class="font-semibold text-base">
              Tren Spend Bulanan
            </h3>
            <p class="text-xs text-muted">
              Total nilai pembelian material per bulan pada rentang ini
            </p>
          </div>
        </template>

        <div v-if="loading && !mpoAnalytics" class="h-[320px] flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <apexchart
          v-else-if="mpoAnalytics && mpoAnalytics.monthly_spend_trend.length"
          height="320"
          type="area"
          :options="trendChartOptions"
          :series="trendChartSeries"
        />
        <div v-else class="h-[320px] flex items-center justify-center text-muted text-sm">
          Tidak ada data tren pada rentang ini
        </div>
      </UCard>
    </div>
  </div>
</template>