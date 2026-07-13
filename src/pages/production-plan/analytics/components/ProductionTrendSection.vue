<script setup lang="ts">
defineProps<{
  productionTrendChartOptions: any
  productionTrendChartSeries: any[]
  lineUtilizationChartOptions: any
  lineUtilizationChartSeries: any[]
}>()

import { defineAsyncComponent } from 'vue'
const apexchart = defineAsyncComponent(() => import('vue3-apexcharts'))
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Production Plan vs Actual
          </h3>
          <p class="text-xs text-muted">
            Daily planned versus actual quantity realization.
          </p>
        </div>
      </template>

      <apexchart
        height="320"
        type="line"
        :options="productionTrendChartOptions"
        :series="productionTrendChartSeries"
      />
    </UCard>

    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Line Capacity Utilization
          </h3>
          <p class="text-xs text-muted">
            Average scheduled capacity utilization per production line.
          </p>
        </div>
      </template>

      <apexchart
        height="320"
        type="bar"
        :options="lineUtilizationChartOptions"
        :series="lineUtilizationChartSeries"
      />
    </UCard>
  </div>
</template>
