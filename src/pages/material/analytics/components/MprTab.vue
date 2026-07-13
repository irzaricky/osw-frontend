<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useColorMode } from '@vueuse/core'
import { useMaterialAnalyticsStore } from '../../../../stores/material/analytics.store'

defineProps<{
  startDate: string
  endDate: string
}>()

const materialAnalyticsStore = useMaterialAnalyticsStore()
const { mprAnalytics, loading } = storeToRefs(materialAnalyticsStore)

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const rejectionRate = computed(() => mprAnalytics.value?.kpis.rejection_rate ?? 0)

const totalSourced = computed(() => {
  const s = mprAnalytics.value?.source_breakdown
  return (s?.from_mrp ?? 0) + (s?.manual ?? 0)
})

const manualPct = computed(() => {
  const s = mprAnalytics.value?.source_breakdown
  const total = totalSourced.value
  if (!s || total === 0) return 0
  return (s.manual / total) * 100
})

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
  const d = mprAnalytics.value?.status_breakdown
  return [d?.draft ?? 0, d?.submitted ?? 0, d?.approved ?? 0, d?.rejected ?? 0]
})

// ─── Bar: Top Requested Parts ─────────────────────────────────────────────────
const topPartsBarOptions = computed(() => ({
  ...chartBaseOptions.value,
  chart: { ...chartBaseOptions.value.chart, type: 'bar' },
  colors: ['#0ea5e9'], // Sky
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
    categories: mprAnalytics.value?.top_requested_parts.map(r => r.part_number || r.part_name || '-') || []
  }
}))

const topPartsBarSeries = computed(() => [
  {
    name: 'Requested Qty',
    data: mprAnalytics.value?.top_requested_parts.map(r => Number(r.total_qty || 0)) || []
  }
])

// ─── Area: Monthly Trend ──────────────────────────────────────────────────────
const trendChartOptions = computed(() => ({
  ...chartBaseOptions.value,
  chart: { ...chartBaseOptions.value.chart, type: 'area' },
  stroke: { curve: 'smooth', width: 3 },
  colors: ['#0ea5e9'],
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1, stops: [0, 90, 100] }
  },
  xaxis: {
    ...chartBaseOptions.value.xaxis,
    categories: mprAnalytics.value?.monthly_trend.map(r => r.month) || []
  }
}))

const trendChartSeries = computed(() => [
  {
    name: 'MPR Created',
    data: mprAnalytics.value?.monthly_trend.map(r => Number(r.count || 0)) || []
  }
])
</script>

<template>
  <div class="space-y-6">
    <!-- Loading Skeleton -->
    <div v-if="loading && !mprAnalytics" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard v-for="i in 3" :key="i">
        <div class="space-y-3">
          <USkeleton class="h-4 w-1/2" />
          <USkeleton class="h-8 w-3/4" />
          <USkeleton class="h-4 w-full" />
        </div>
      </UCard>
    </div>

    <!-- KPI Cards -->
    <div v-else-if="mprAnalytics" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 1. MPR Status -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">MPR Status</span>
            <UIcon name="i-lucide-file-text" class="w-5 h-5 text-sky-500" />
          </div>
          <div class="grid grid-cols-2 gap-2 border-t border-default pt-3">
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Draft</span>
              <span class="text-sm font-bold text-muted">{{ mprAnalytics.status_breakdown.draft || 0 }}</span>
            </div>
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Submitted</span>
              <span class="text-sm font-bold text-warning">{{ mprAnalytics.status_breakdown.submitted || 0 }}</span>
            </div>
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Approved</span>
              <span class="text-sm font-bold text-success">{{ mprAnalytics.status_breakdown.approved || 0 }}</span>
            </div>
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Rejected</span>
              <span class="text-sm font-bold text-error">{{ mprAnalytics.status_breakdown.rejected || 0 }}</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- 2. Rejection Rate -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">MPR Rejection Rate</span>
            <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ rejectionRate.toFixed(1) }}%
            </p>
            <p class="text-xs text-muted mt-1">
              Persentase MPR Rejected dari total Approved + Rejected
            </p>
          </div>
        </div>
      </UCard>

      <!-- 3. Emergency (Manual) vs MRP-driven -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Emergency PR Ratio</span>
            <UIcon name="i-lucide-siren" class="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ manualPct.toFixed(1) }}%
            </p>
            <p class="text-xs text-muted mt-1">
              Persentase MPR manual (tanpa MRP) dari total {{ totalSourced }} MPR
            </p>
          </div>
          <div class="border-t border-default pt-3 space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-muted">Dari MRP:</span>
              <span class="font-semibold text-success">{{ mprAnalytics.source_breakdown.from_mrp }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-muted">Manual / Emergency:</span>
              <span class="font-semibold text-warning">{{ mprAnalytics.source_breakdown.manual }}</span>
            </div>
            <UProgress :model-value="manualPct" color="warning" class="mt-2" />
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
              MPR Status Breakdown
            </h3>
            <p class="text-xs text-muted">
              Distribusi dokumen MPR berdasarkan status saat ini
            </p>
          </div>
        </template>

        <div v-if="loading && !mprAnalytics" class="h-[320px] flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <apexchart
          v-else-if="mprAnalytics && (statusDonutSeries.reduce((a, b) => a + b, 0) > 0)"
          height="320"
          type="donut"
          :options="statusDonutOptions"
          :series="statusDonutSeries"
        />
        <div v-else class="h-[320px] flex items-center justify-center text-muted text-sm">
          Belum ada data status pada rentang ini
        </div>
      </UCard>

      <!-- Top Requested Parts -->
      <UCard>
        <template #header>
          <div>
            <h3 class="font-semibold text-base">
              Top 10 Part Paling Sering Diajukan
            </h3>
            <p class="text-xs text-muted">
              Part dengan total quantity request terbesar pada rentang ini
            </p>
          </div>
        </template>

        <div v-if="loading && !mprAnalytics" class="h-[320px] flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <apexchart
          v-else-if="mprAnalytics && mprAnalytics.top_requested_parts.length"
          height="320"
          type="bar"
          :options="topPartsBarOptions"
          :series="topPartsBarSeries"
        />
        <div v-else class="h-[320px] flex items-center justify-center text-muted text-sm">
          Tidak ada data part pada rentang ini
        </div>
      </UCard>

      <!-- Monthly Trend -->
      <UCard class="xl:col-span-2">
        <template #header>
          <div>
            <h3 class="font-semibold text-base">
              Tren Pengajuan MPR per Bulan
            </h3>
            <p class="text-xs text-muted">
              Jumlah dokumen MPR yang diajukan setiap bulan pada rentang ini
            </p>
          </div>
        </template>

        <div v-if="loading && !mprAnalytics" class="h-[320px] flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <apexchart
          v-else-if="mprAnalytics && mprAnalytics.monthly_trend.length"
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