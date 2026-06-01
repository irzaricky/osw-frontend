<script setup lang="ts">
import { computed } from 'vue'
import type { QuantityDeficitItem } from '../../../../stores/sales/analytics.store'

const props = defineProps<{
  data: QuantityDeficitItem[]
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
  xaxis: {
    labels: { style: { colors: '#a1a1aa' } },
    axisBorder: { color: '#3f3f46' },
    axisTicks: { color: '#3f3f46' }
  },
  yaxis: {
    labels: { style: { colors: '#a1a1aa' } }
  },
  legend: {
    position: 'top',
    horizontalAlign: 'left',
    labels: { colors: '#a1a1aa' }
  }
}

const chartOptions = computed(() => ({
  ...chartBaseOptions,
  chart: {
    ...chartBaseOptions.chart,
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
            color: '#a1a1aa',
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
    ...chartBaseOptions.grid,
    padding: {
      right: 50
    }
  },
  xaxis: {
    ...chartBaseOptions.xaxis,
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
          Defisit Kuantitas Pengiriman (Sent vs Received)
        </h3>
        <p class="text-xs text-muted">
          Perbandingan kuantitas kirim vs diterima per part number
        </p>
      </div>
    </template>

    <div v-if="loading && !data.length" class="h-[320px] flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
    </div>
    <div v-else-if="!data.length" class="h-[320px] flex items-center justify-center text-muted text-sm">
      Tidak ada data pengiriman dalam periode ini
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
