<script setup lang="ts">
defineProps<{
  downtimeByTypeChartOptions: any
  downtimeByTypeChartSeries: any[]
  topDowntimeStationsChartOptions: any
  topDowntimeStationsChartSeries: any[]
}>()
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Top 5 Downtime Causes
          </h3>
          <p class="text-xs text-muted">
            Total downtime minutes grouped by issue type.
          </p>
        </div>
      </template>

      <apexchart
        height="320"
        type="bar"
        :options="downtimeByTypeChartOptions"
        :series="downtimeByTypeChartSeries"
      />
    </UCard>

    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Top 5 Bottleneck Stations
          </h3>
          <p class="text-xs text-muted">
            Stations contributing the most downtime minutes.
          </p>
        </div>
      </template>

      <apexchart
        height="320"
        type="bar"
        :options="topDowntimeStationsChartOptions"
        :series="topDowntimeStationsChartSeries"
      />
    </UCard>
  </div>
</template>
