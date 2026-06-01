<script setup lang="ts">
import { computed } from 'vue'
import type { SdoAnalyticsStatusCounts } from '../../../../stores/sales/analytics.store'

const props = defineProps<{
  statusCounts: SdoAnalyticsStatusCounts
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
  legend: {
    position: 'bottom',
    labels: { colors: '#a1a1aa' }
  }
}

const chartOptions = computed(() => ({
  ...chartBaseOptions,
  chart: {
    ...chartBaseOptions.chart,
    type: 'donut'
  },
  labels: ['Delivered', 'In Transit', 'Loading', 'Created'],
  colors: ['#10b981', '#3b82f6', '#f59e0b', '#71717a'], // green, blue, amber, zinc
  plotOptions: {
    pie: {
      donut: {
        size: '65%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total SDO',
            color: '#a1a1aa',
            formatter: () => {
              const total = (props.statusCounts.Delivered || 0) +
                (props.statusCounts['In Transit'] || 0) +
                (props.statusCounts.Loading || 0) +
                (props.statusCounts.Created || 0)
              return total.toString()
            }
          }
        }
      }
    }
  },
  dataLabels: {
    enabled: true,
    formatter: (_val: number, opts: any) => {
      return opts.w.config.series[opts.seriesIndex]
    }
  }
}))

const chartSeries = computed(() => [
  props.statusCounts.Delivered || 0,
  props.statusCounts['In Transit'] || 0,
  props.statusCounts.Loading || 0,
  props.statusCounts.Created || 0
])
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h3 class="font-semibold text-base">
          Distribusi Status SDO
        </h3>
        <p class="text-xs text-muted">
          Persentase status Sales Delivery Order saat ini
        </p>
      </div>
    </template>

    <div v-if="loading && !chartSeries.some(v => v > 0)" class="h-[320px] flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
    </div>
    <div v-else-if="!chartSeries.some(v => v > 0)" class="h-[320px] flex items-center justify-center text-muted text-sm">
      Tidak ada data status SDO dalam periode ini
    </div>
    <apexchart
      v-else
      height="320"
      type="donut"
      :options="chartOptions"
      :series="chartSeries"
    />
  </UCard>
</template>
