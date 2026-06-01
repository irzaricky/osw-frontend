<script setup lang="ts">
import { computed } from 'vue'
import { useColorMode } from '@vueuse/core'
import type { QuantityDeficitItem } from '../../../../stores/sales/analytics.store'

const props = defineProps<{
  data: QuantityDeficitItem[]
  loading: boolean
}>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const chartBaseOptions = computed(() => {
  const textColor = isDark.value ? '#a1a1aa' : '#3f3f46'
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
      position: 'top' as const,
      horizontalAlign: 'left' as const,
      labels: { colors: legendColor }
    }
  }
})

const chartOptions = computed(() => ({
  ...chartBaseOptions.value,
  chart: {
    ...chartBaseOptions.value.chart,
    type: 'bar',
    stacked: true
  },
  colors: ['#10b981', '#ef4444'], // Emerald for Received, Red for Deficit
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 4,
      barHeight: '55%',
      dataLabels: {
        total: {
          enabled: true,
          style: {
            color: isDark.value ? '#a1a1aa' : '#4b5563',
            fontSize: '11px',
            fontWeight: 600
          },
          offsetX: 10
        }
      }
    }
  },
  dataLabels: {
    enabled: true,
    textAnchor: 'start',
    offsetX: 5,
    style: { colors: ['#ffffff'], fontSize: '10px', fontWeight: 500 },
    formatter: (val: number) => val > 0 ? val.toLocaleString() : ''
  },
  grid: {
    ...chartBaseOptions.value.grid,
    padding: {
      right: 50
    }
  },
  xaxis: {
    ...chartBaseOptions.value.xaxis,
    categories: props.data.map(r => r.part_name)
  }
}))

const chartSeries = computed(() => [
  {
    name: 'Received Volume',
    data: props.data.map(r => Number(r.total_received || 0))
  },
  {
    name: 'Deficit Volume',
    data: props.data.map(r => {
      const sent = Number(r.total_sent || 0)
      const received = Number(r.total_received || 0)
      return Math.max(0, sent - received)
    })
  }
])
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h3 class="font-semibold text-base">
          Shipment Quantity Deficit (Sent vs Received)
        </h3>
        <p class="text-xs text-muted">
          Comparison of sent vs received quantity per part number
        </p>
      </div>
    </template>

    <div v-if="loading && !data.length" class="h-[320px] flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
    </div>
    <div v-else-if="!data.length" class="h-[320px] flex items-center justify-center text-muted text-sm">
      No shipment data available for this range
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
