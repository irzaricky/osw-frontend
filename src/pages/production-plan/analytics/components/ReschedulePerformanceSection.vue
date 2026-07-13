<script setup lang="ts">
defineProps<{
  rescheduleChartOptions: any
  rescheduleChartSeries: any[]
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h3 class="font-semibold">
          Production Order Reschedule Frequency
        </h3>
        <p class="text-xs text-muted">
          Daily count of reschedules and impacted work orders.
        </p>
      </div>
    </template>

    <apexchart
      height="280"
      type="line"
      :options="rescheduleChartOptions"
      :series="rescheduleChartSeries"
    />
  </UCard>
</template>
