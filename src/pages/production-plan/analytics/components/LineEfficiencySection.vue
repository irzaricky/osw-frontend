<script setup lang="ts">
defineProps<{
  lineEfficiencyChartOptions: any
  lineEfficiencyChartSeries: any[]
  capacityFeasibilityChartOptions: any
  capacityFeasibilityChartSeries: any[]
}>()
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Line Efficiency Ranking
          </h3>
          <p class="text-xs text-muted">
            Actual versus planned quantity realization per line.
          </p>
        </div>
      </template>

      <apexchart
        height="320"
        type="bar"
        :options="lineEfficiencyChartOptions"
        :series="lineEfficiencyChartSeries"
      />
    </UCard>

    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Capacity Feasibility
          </h3>
          <p class="text-xs text-muted">
            Distribution of capacity calculation results, possible versus impossible lines.
          </p>
        </div>
      </template>

      <apexchart
        height="320"
        type="donut"
        :options="capacityFeasibilityChartOptions"
        :series="capacityFeasibilityChartSeries"
      />
    </UCard>
  </div>
</template>
