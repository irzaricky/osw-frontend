<script setup lang="ts">
import { computed } from 'vue'
import { defineAsyncComponent } from 'vue'
const apexchart = defineAsyncComponent(() => import('vue3-apexcharts'))

const props = defineProps<{
  forecastVsSpo: Array<{ month: string; forecast_target: number; spo_actual: number }>
  loading: boolean
}>()

const chartBaseOptions = {
  theme: { mode: 'dark' },
  chart: {
    background: 'transparent',
    foreColor: '#a1a1aa',
    toolbar: { show: false }
  },
  grid: { borderColor: '#27272a' },
  tooltip: { theme: 'dark' },
  dataLabels: { enabled: false },
  xaxis: {
    labels: { style: { colors: '#a1a1aa' } },
    axisBorder: { color: '#3f3f46' },
    axisTicks: { color: '#3f3f46' }
  },
  yaxis: {
    labels: { style: { colors: '#a1a1aa' } }
  }
}

const chartOptions = computed(() => ({
  ...chartBaseOptions,
  chart: {
    ...chartBaseOptions.chart,
    type: 'bar'
  },
  colors: ['#8b5cf6', '#10b981'],
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '60%'
    }
  },
  xaxis: {
    ...chartBaseOptions.xaxis,
    categories: props.forecastVsSpo.map(r => r.month)
  }
}))

const chartSeries = computed(() => [
  {
    name: 'Forecast Target',
    data: props.forecastVsSpo.map(r => Number(r.forecast_target || 0))
  },
  {
    name: 'SPO Actual',
    data: props.forecastVsSpo.map(r => Number(r.spo_actual || 0))
  }
])
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h3 class="font-semibold text-base">
          Forecast vs SPO Correlation
        </h3>
        <p class="text-xs text-muted">
          Target vs realization, last 6 months
        </p>
      </div>
    </template>

    <div v-if="loading && !forecastVsSpo.length" class="h-[320px] flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
    </div>
    <apexchart
      v-else
      height="320"
      type="bar"
      :options="chartOptions"
      :series="chartSeries"
    />
  </UCard>
</template>
