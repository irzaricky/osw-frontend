<script setup lang="ts">
defineProps<{
  fastMovingChartOptions: any
  fastMovingChartSeries: any[]
  slowMovingChartOptions: any
  slowMovingChartSeries: any[]
}>()
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Top 5 Fast Moving Items
          </h3>
          <p class="text-xs text-muted">
            Parts with the highest take out frequency.
          </p>
        </div>
      </template>

      <apexchart
        height="320"
        type="bar"
        :options="fastMovingChartOptions"
        :series="fastMovingChartSeries"
      />
    </UCard>

    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Top 5 Slow Moving Items
          </h3>
          <p class="text-xs text-muted">
            Parts with the oldest active stock.
          </p>
        </div>
      </template>

      <apexchart
        height="320"
        type="bar"
        :options="slowMovingChartOptions"
        :series="slowMovingChartSeries"
      />
    </UCard>
  </div>
</template>