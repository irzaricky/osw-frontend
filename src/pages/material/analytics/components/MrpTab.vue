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
const { mrpAnalytics, loading } = storeToRefs(materialAnalyticsStore)

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const rejectionRate = computed(() => mrpAnalytics.value?.kpis.rejection_rate ?? 0)

// ─── Chart base options (konsisten dengan ForecastTab/SprTab) ────────────────
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

// ─── Donut: Priority Breakdown ────────────────────────────────────────────────
const priorityDonutOptions = computed(() => ({
  ...chartBaseOptions.value,
  chart: { ...chartBaseOptions.value.chart, type: 'donut' },
  labels: ['High', 'Medium', 'Low'],
  colors: ['#ef4444', '#f59e0b', '#10b981'], // Red, Amber, Emerald
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

const priorityDonutSeries = computed(() => {
  const d = mrpAnalytics.value?.priority_breakdown
  return [d?.High ?? 0, d?.Medium ?? 0, d?.Low ?? 0]
})

// ─── Bar: Top 10 Shortage Parts ───────────────────────────────────────────────
const shortageBarOptions = computed(() => ({
  ...chartBaseOptions.value,
  chart: { ...chartBaseOptions.value.chart, type: 'bar' },
  colors: ['#ef4444'], // Red — menandakan kekurangan stok
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 4,
      barHeight: '55%',
      dataLabels: { position: 'right', hideOverflowingLabels: false }
    }
  },
  dataLabels: {
    enabled: true,
    textAnchor: 'start',
    offsetX: 10,
    style: { colors: [isDark.value ? '#e4e4e7' : '#3f3f46'], fontSize: '11px' },
    formatter: (val: number) => val.toLocaleString()
  },
  grid: {
    ...chartBaseOptions.value.grid,
    padding: { right: 40 }
  },
  xaxis: {
    ...chartBaseOptions.value.xaxis,
    categories: mrpAnalytics.value?.top_shortage_parts.map(r => r.part_number || r.part_name || '-') || []
  }
}))

const shortageBarSeries = computed(() => [
  {
    name: 'Shortage Qty',
    data: mrpAnalytics.value?.top_shortage_parts.map(r => Number(r.total_shortage_qty || 0)) || []
  }
])

// ─── Area: Monthly MRP Created Trend ──────────────────────────────────────────
const trendChartOptions = computed(() => ({
  ...chartBaseOptions.value,
  chart: { ...chartBaseOptions.value.chart, type: 'area' },
  stroke: { curve: 'smooth', width: 3 },
  colors: ['#6366f1'], // Indigo
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1, stops: [0, 90, 100] }
  },
  xaxis: {
    ...chartBaseOptions.value.xaxis,
    categories: mrpAnalytics.value?.monthly_trend.map(r => r.month) || []
  }
}))

const trendChartSeries = computed(() => [
  {
    name: 'MRP Created',
    data: mrpAnalytics.value?.monthly_trend.map(r => Number(r.count || 0)) || []
  }
])
</script>

<template>
  <div class="space-y-6">
    <!-- Loading Skeleton -->
    <div v-if="loading && !mrpAnalytics" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard v-for="i in 2" :key="i">
        <div class="space-y-3">
          <USkeleton class="h-4 w-1/2" />
          <USkeleton class="h-8 w-3/4" />
          <USkeleton class="h-4 w-full" />
        </div>
      </UCard>
    </div>

    <!-- KPI Cards -->
    <div v-else-if="mrpAnalytics" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- 1. MRP Status -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">MRP Status</span>
            <UIcon name="i-lucide-clipboard-list" class="w-5 h-5 text-indigo-500" />
          </div>
          <div class="grid grid-cols-2 gap-2 border-t border-default pt-3">
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Draft</span>
              <span class="text-sm font-bold text-muted">{{ mrpAnalytics.status_breakdown.Draft || 0 }}</span>
            </div>
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Submitted</span>
              <span class="text-sm font-bold text-warning">{{ mrpAnalytics.status_breakdown.Submitted || 0 }}</span>
            </div>
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Approved</span>
              <span class="text-sm font-bold text-success">{{ mrpAnalytics.status_breakdown.Approved || 0 }}</span>
            </div>
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Rejected</span>
              <span class="text-sm font-bold text-error">{{ mrpAnalytics.status_breakdown.Rejected || 0 }}</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- 2. Rejection Rate -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">MRP Rejection Rate</span>
            <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ rejectionRate.toFixed(1) }}%
            </p>
            <p class="text-xs text-muted mt-1">
              Persentase MRP Rejected dari total Approved + Rejected
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Charts Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Priority Breakdown Donut -->
      <UCard>
        <template #header>
          <div>
            <h3 class="font-semibold text-base">
              MRP Priority Breakdown
            </h3>
            <p class="text-xs text-muted">
              Distribusi MRP berdasarkan tingkat urgensi
            </p>
          </div>
        </template>

        <div v-if="loading && !mrpAnalytics" class="h-[320px] flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <apexchart
          v-else-if="mrpAnalytics && (priorityDonutSeries.reduce((a, b) => a + b, 0) > 0)"
          height="320"
          type="donut"
          :options="priorityDonutOptions"
          :series="priorityDonutSeries"
        />
        <div v-else class="h-[320px] flex items-center justify-center text-muted text-sm">
          Belum ada data priority pada rentang ini
        </div>
      </UCard>

      <!-- Top Shortage Parts -->
      <UCard>
        <template #header>
          <div>
            <h3 class="font-semibold text-base">
              Top 10 Material Shortage
            </h3>
            <p class="text-xs text-muted">
              Part dengan selisih qty kebutuhan vs stok gudang terbesar (MRP Submitted/Approved)
            </p>
          </div>
        </template>

        <div v-if="loading && !mrpAnalytics" class="h-[320px] flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <apexchart
          v-else-if="mrpAnalytics && mrpAnalytics.top_shortage_parts.length"
          height="320"
          type="bar"
          :options="shortageBarOptions"
          :series="shortageBarSeries"
        />
        <div v-else class="h-[320px] flex items-center justify-center text-muted text-sm">
          Tidak ada shortage material pada rentang ini
        </div>
      </UCard>

      <!-- Monthly Trend -->
      <UCard class="xl:col-span-2">
        <template #header>
          <div>
            <h3 class="font-semibold text-base">
              Tren Pembuatan MRP per Bulan
            </h3>
            <p class="text-xs text-muted">
              Jumlah dokumen MRP yang dibuat setiap bulan pada rentang ini
            </p>
          </div>
        </template>

        <div v-if="loading && !mrpAnalytics" class="h-[320px] flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <apexchart
          v-else-if="mrpAnalytics && mrpAnalytics.monthly_trend.length"
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