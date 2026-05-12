<script setup lang="ts">
defineProps<{
  inventoryValueByAreaChartOptions: any
  inventoryValueByAreaChartSeries: any[]
  topInventoryValueChartOptions: any
  topInventoryValueChartSeries: any[]
}>()
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Inventory Value by Warehouse Area
          </h3>
          <p class="text-xs text-muted">
            Capital value of active stock grouped by warehouse area.
          </p>
        </div>
      </template>

      <apexchart
        height="320"
        type="bar"
        :options="inventoryValueByAreaChartOptions"
        :series="inventoryValueByAreaChartSeries"
      />
    </UCard>

    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Top 5 Highest Inventory Value
          </h3>
          <p class="text-xs text-muted">
            Parts with the highest active inventory value.
          </p>
        </div>
      </template>

      <apexchart
        height="320"
        type="bar"
        :options="topInventoryValueChartOptions"
        :series="topInventoryValueChartSeries"
      />
    </UCard>
  </div>
</template>