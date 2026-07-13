<script setup lang="ts">
defineProps<{
  outputQualityChartOptions: any
  outputQualityChartSeries: any[]
  defectByTypeChartOptions: any
  defectByTypeChartSeries: any[]
}>()
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Output Quality Trend
          </h3>
          <p class="text-xs text-muted">
            Daily good, reject, and scrap quantity from work order progress reports.
          </p>
        </div>
      </template>

      <apexchart
        height="320"
        type="bar"
        :options="outputQualityChartOptions"
        :series="outputQualityChartSeries"
      />
    </UCard>

    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Top 5 Defect Types
          </h3>
          <p class="text-xs text-muted">
            Defect quantity grouped by recorded defect type.
          </p>
        </div>
      </template>

      <apexchart
        height="320"
        type="bar"
        :options="defectByTypeChartOptions"
        :series="defectByTypeChartSeries"
      />
    </UCard>
  </div>
</template>
