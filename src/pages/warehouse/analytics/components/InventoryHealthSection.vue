<script setup lang="ts">
defineProps<{
  inventoryHealth: {
    out_of_stock: number
    critical_stock: number
    safe_stock: number
    overstock: number
  }
  chartOptions: any
  chartSeries: number[]
}>()
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Inventory Health
          </h3>
          <p class="text-xs text-muted">
            Stock condition compared with safety stock.
          </p>
        </div>
      </template>

      <apexchart height="280" type="donut" :options="chartOptions" :series="chartSeries" />
    </UCard>

    <div class="xl:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
      <UCard>
        <p class="text-sm font-semibold">
          Out of Stock
        </p>

        <p class="text-xs text-muted mt-1">
          Stock = 0 kanban.
        </p>

        <p class="text-2xl font-bold mt-3 text-error">
          {{ inventoryHealth.out_of_stock }}
        </p>
      </UCard>

      <UCard>
        <p class="text-sm font-semibold">
          Critical
        </p>

        <p class="text-xs text-muted mt-1">
          Stock < safety stock. </p>

            <p class="text-2xl font-bold mt-3 text-error">
              {{ inventoryHealth.critical_stock }}
            </p>
      </UCard>

      <UCard>
        <p class="text-sm font-semibold">
          Safe
        </p>

        <p class="text-xs text-muted mt-1">
          Stock memenuhi safety stock.
        </p>

        <p class="text-2xl font-bold mt-3 text-success">
          {{ inventoryHealth.safe_stock }}
        </p>
      </UCard>

      <UCard>
        <p class="text-sm font-semibold">
          Overstock
        </p>

        <p class="text-xs text-muted mt-1">
          Stock > 2x safety stock.
        </p>

        <p class="text-2xl font-bold mt-3 text-warning">
          {{ inventoryHealth.overstock }}
        </p>
      </UCard>
    </div>
  </div>
</template>