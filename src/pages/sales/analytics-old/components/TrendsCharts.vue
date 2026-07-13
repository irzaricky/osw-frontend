<script setup lang="ts">
import { computed } from 'vue'
import { defineAsyncComponent } from 'vue'
const apexchart = defineAsyncComponent(() => import('vue3-apexcharts'))

const props = defineProps<{
  trends: any[]
  loading: boolean
}>()

const chartBaseOptions = {
  theme: {
    mode: 'dark'
  },
  chart: {
    background: 'transparent',
    foreColor: '#a1a1aa',
    toolbar: {
      show: false
    }
  },
  grid: {
    borderColor: '#27272a'
  },
  tooltip: {
    theme: 'dark'
  },
  dataLabels: {
    enabled: false
  },
  xaxis: {
    labels: {
      style: {
        colors: '#a1a1aa'
      }
    },
    axisBorder: {
      color: '#3f3f46'
    },
    axisTicks: {
      color: '#3f3f46'
    }
  },
  yaxis: {
    labels: {
      style: {
        colors: '#a1a1aa'
      }
    }
  }
}

const orderChartOptions = computed(() => ({
  ...chartBaseOptions,
  chart: {
    ...chartBaseOptions.chart,
    type: 'area'
  },
  colors: ['#4f46e5', '#10b981'], // Indigo and Emerald
  stroke: {
    curve: 'smooth',
    width: 3
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.45,
      opacityTo: 0.05,
      stops: [0, 100]
    }
  },
  xaxis: {
    ...chartBaseOptions.xaxis,
    categories: props.trends.map(row => row.month)
  }
}))

const orderChartSeries = computed(() => [
  {
    name: 'Total SPOs',
    data: props.trends.map(row => Number(row.spo_count || 0))
  },
  {
    name: 'Delivered SDOs',
    data: props.trends.map(row => Number(row.delivered_sdo_count || 0))
  }
])

const fulfillmentChartOptions = computed(() => ({
  ...chartBaseOptions,
  chart: {
    ...chartBaseOptions.chart,
    type: 'bar'
  },
  colors: ['#3b82f6', '#8b5cf6'], // Blue and Violet
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '55%'
    }
  },
  xaxis: {
    ...chartBaseOptions.xaxis,
    categories: props.trends.map(row => row.month)
  }
}))

const fulfillmentChartSeries = computed(() => [
  {
    name: 'Planned Items (pcs)',
    data: props.trends.map(row => Number(row.total_planned_qty || 0))
  },
  {
    name: 'Received Items (pcs)',
    data: props.trends.map(row => Number(row.total_received_qty || 0))
  }
])
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
    <!-- 1. Order & Dispatch Trend -->
    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold text-base">
            Order & Shipment Trends
          </h3>
          <p class="text-xs text-muted">
            Comparison of issued SPOs vs delivered SDOs over the last 12 months.
          </p>
        </div>
      </template>

      <div v-if="loading && !trends.length" class="h-[320px] flex items-center justify-center">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
      </div>
      <apexchart
        v-else
        height="320"
        type="area"
        :options="orderChartOptions"
        :series="orderChartSeries"
      />
    </UCard>

    <!-- 2. Fulfillment Discrepancy -->
    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold text-base">
            Quantity Fulfillment Analysis
          </h3>
          <p class="text-xs text-muted">
            Comparison of planned item quantities vs actual received goods.
          </p>
        </div>
      </template>

      <div v-if="loading && !trends.length" class="h-[320px] flex items-center justify-center">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
      </div>
      <apexchart
        v-else
        height="320"
        type="bar"
        :options="fulfillmentChartOptions"
        :series="fulfillmentChartSeries"
      />
    </UCard>
  </div>
</template>
te>
