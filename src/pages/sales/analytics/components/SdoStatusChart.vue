<script setup lang="ts">
import { computed } from 'vue'
import { useColorMode } from '@vueuse/core'
import type { SdoAnalyticsStatusCounts } from '../../../../stores/sales/analytics.store'

const props = defineProps<{
  statusCounts: SdoAnalyticsStatusCounts
  loading: boolean
}>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const chartBaseOptions = computed(() => {
  const textColor = isDark.value ? '#a1a1aa' : '#3f3f46'
  const borderColor = isDark.value ? '#27272a' : '#e2e8f0'
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
    legend: {
      position: 'bottom' as const,
      labels: { colors: legendColor }
    }
  }
})

const chartOptions = computed(() => ({
  ...chartBaseOptions.value,
  chart: {
    ...chartBaseOptions.value.chart,
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
            color: isDark.value ? '#a1a1aa' : '#4b5563',
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
          SDO Status Distribution
        </h3>
        <p class="text-xs text-muted">
          Current percentage of Sales Delivery Order status
        </p>
      </div>
    </template>

    <div v-if="loading && !chartSeries.some(v => v > 0)" class="h-[320px] flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
    </div>
    <div v-else-if="!chartSeries.some(v => v > 0)" class="h-[320px] flex items-center justify-center text-muted text-sm">
      No SDO status data available for this range
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
