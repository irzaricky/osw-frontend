<script setup lang="ts">
import { computed } from 'vue'
import { defineAsyncComponent } from 'vue'
const apexchart = defineAsyncComponent(() => import('vue3-apexcharts'))

const props = defineProps<{
  topCustomers: Array<{ customer_id: number; customer_name: string; total_ordered_qty: number }>
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
  }
}

const chartOptions = computed(() => ({
  ...chartBaseOptions,
  chart: {
    ...chartBaseOptions.chart,
    type: 'bar'
  },
  colors: ['#4f46e5'],
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
    categories: props.topCustomers.map(r => r.customer_name)
  }
}))

const chartSeries = computed(() => [
  {
    name: 'Ordered Qty (pcs)',
    data: props.topCustomers.map(r => Number(r.total_ordered_qty || 0))
  }
])
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h3 class="font-semibold text-base">
          Top 5 Customers
        </h3>
        <p class="text-xs text-muted">
          By ordered quantity in selected period
        </p>
      </div>
    </template>

    <div v-if="loading && !topCustomers.length" class="h-[320px] flex items-center justify-center">
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
