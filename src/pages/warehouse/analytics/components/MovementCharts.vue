<script setup lang="ts">
defineProps<{
  movementChartOptions: any
  movementChartSeries: any[]
  utilizationChartOptions: any
  utilizationChartSeries: any[]
}>()
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Stock Movement Trend
          </h3>
          <p class="text-xs text-muted">
            Daily placement vs take out movement.
          </p>
        </div>
      </template>

      <apexchart
        height="320"
        type="line"
        :options="movementChartOptions"
        :series="movementChartSeries"
      />
    </UCard>

    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Warehouse Utilization
          </h3>
          <p class="text-xs text-muted">
            Storage utilization percentage by warehouse area.
          </p>
        </div>
      </template>

      <apexchart
        height="320"
        type="bar"
        :options="utilizationChartOptions"
        :series="utilizationChartSeries"
      />
    </UCard>
  </div>
</template>