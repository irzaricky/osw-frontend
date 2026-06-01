<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSalesAnalyticsStore } from '../../../../stores/sales/analytics.store'

const props = defineProps<{
  startDate: string
  endDate: string
}>()

const salesAnalyticsStore = useSalesAnalyticsStore()
const { forecastAnalytics, loading } = storeToRefs(salesAnalyticsStore)

async function fetchData() {
  await salesAnalyticsStore.fetchForecastAnalytics({
    start_date: props.startDate,
    end_date: props.endDate
  })
}

// Watch filters
watch(() => [props.startDate, props.endDate], () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})

// KPI data
const totalVolume = computed(() => forecastAnalytics.value?.kpis.total_volume ?? 0)
const accuracyRate = computed(() => forecastAnalytics.value?.kpis.accuracy_rate ?? 0)
const activeVersions = computed(() => forecastAnalytics.value?.kpis.active_versions ?? 0)

// Chart configuration
const chartBaseOptions = {
  theme: { mode: 'dark' },
  chart: {
    background: 'transparent',
    foreColor: '#a1a1aa',
    toolbar: { show: false }
  },
  grid: { borderColor: '#27272a' },
  tooltip: { theme: 'dark' },
  xaxis: {
    labels: { style: { colors: '#a1a1aa' } },
    axisBorder: { color: '#3f3f46' },
    axisTicks: { color: '#3f3f46' }
  },
  yaxis: {
    labels: { style: { colors: '#a1a1aa' } }
  }
}

// Line Chart: Forecast vs Actual Trends
const lineChartOptions = computed(() => ({
  ...chartBaseOptions,
  chart: {
    ...chartBaseOptions.chart,
    type: 'line'
  },
  stroke: {
    curve: 'smooth',
    width: 3
  },
  colors: ['#06b6d4', '#e11d48'], // cyan for forecast/temp, rose for actual/fix
  xaxis: {
    ...chartBaseOptions.xaxis,
    categories: forecastAnalytics.value?.trends.map(r => r.month) || []
  }
}))

const lineChartSeries = computed(() => [
  {
    name: 'Forecast (Temporary)',
    data: forecastAnalytics.value?.trends.map(r => Number(r.temporary_qty || 0)) || []
  },
  {
    name: 'Actual Sales (Fix)',
    data: forecastAnalytics.value?.trends.map(r => Number(r.fix_qty || 0)) || []
  }
])

// Bar Chart: Top Forecasted Products
const barChartOptions = computed(() => ({
  ...chartBaseOptions,
  chart: {
    ...chartBaseOptions.chart,
    type: 'bar'
  },
  colors: ['#3b82f6'], // blue
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
    style: { colors: ['#a1a1aa'], fontSize: '11px' },
    formatter: (val: number) => val.toLocaleString()
  },
  xaxis: {
    ...chartBaseOptions.xaxis,
    categories: forecastAnalytics.value?.top_products.map(r => r.part_name) || []
  }
}))

const barChartSeries = computed(() => [
  {
    name: 'Forecast Volume (pcs)',
    data: forecastAnalytics.value?.top_products.map(r => Number(r.total_qty || 0)) || []
  }
])
</script>

<template>
  <div class="space-y-6">
    <!-- Metric Cards Grid -->
    <div v-if="loading && !forecastAnalytics" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard v-for="i in 3" :key="i">
        <div class="space-y-3">
          <USkeleton class="h-4 w-1/2" />
          <USkeleton class="h-8 w-3/4" />
          <USkeleton class="h-4 w-full" />
        </div>
      </UCard>
    </div>

    <div v-else-if="forecastAnalytics" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 1. Total Volume -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Total Forecasted Volume</span>
            <UIcon name="i-lucide-trending-up" class="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ totalVolume.toLocaleString() }} pcs
            </p>
            <p class="text-xs text-muted mt-1">
              Volume forecast total (status Approved)
            </p>
          </div>
        </div>
      </UCard>

      <!-- 2. Accuracy Rate -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Forecast Accuracy Rate</span>
            <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ accuracyRate.toFixed(1) }}%
            </p>
            <p class="text-xs text-muted mt-1">
              Rata-rata akurasi Fix vs Temporary
            </p>
          </div>
        </div>
      </UCard>

      <!-- 3. Active Versions -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Active Versions</span>
            <UIcon name="i-lucide-file-text" class="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ activeVersions }} draf
            </p>
            <p class="text-xs text-muted mt-1">
              Draft / Submitted forecast berjalan
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Charts Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Forecast vs Actual Line Chart -->
      <UCard>
        <template #header>
          <div>
            <h3 class="font-semibold text-base">
              Forecast vs Actual Sales
            </h3>
            <p class="text-xs text-muted">
              Trend Temporary Qty vs Fix Qty bulanan
            </p>
          </div>
        </template>

        <div v-if="loading && !forecastAnalytics" class="h-[320px] flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <apexchart
          v-else-if="forecastAnalytics && forecastAnalytics.trends.length"
          height="320"
          type="line"
          :options="lineChartOptions"
          :series="lineChartSeries"
        />
        <div v-else class="h-[320px] flex items-center justify-center text-muted text-sm">
          No data available for this range
        </div>
      </UCard>

      <!-- Top Forecasted Products Bar Chart -->
      <UCard>
        <template #header>
          <div>
            <h3 class="font-semibold text-base">
              Top Forecasted Products
            </h3>
            <p class="text-xs text-muted">
              5 Produk teratas berdasarkan total volume forecast
            </p>
          </div>
        </template>

        <div v-if="loading && !forecastAnalytics" class="h-[320px] flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <apexchart
          v-else-if="forecastAnalytics && forecastAnalytics.top_products.length"
          height="320"
          type="bar"
          :options="barChartOptions"
          :series="barChartSeries"
        />
        <div v-else class="h-[320px] flex items-center justify-center text-muted text-sm">
          No data available for this range
        </div>
      </UCard>
    </div>
  </div>
</template>
