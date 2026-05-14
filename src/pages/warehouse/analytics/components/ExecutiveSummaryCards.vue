<script setup lang="ts">
defineProps<{
  executiveSummary: any
  inventoryValue: any
  utilizationPercentage: number
}>()

function formatCurrency(value: any) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}

function formatPartCategory(category?: string) {
  if (category === 'RAW') return 'Raw Material'
  if (category === 'WIP') return 'WIP'
  if (category === 'PRODUCT') return 'Product'
  return category || '-'
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
    <UCard>
      <div class="space-y-4">
        <div>
          <p class="text-sm text-muted">
            Inventory Value
          </p>

          <p class="text-2xl font-bold">
            {{ formatCurrency(inventoryValue.summary.total_inventory_value || 0) }}
          </p>
        </div>

        <div class="space-y-2 border-t border-default pt-3">
          <div v-for="item in inventoryValue.by_category" :key="item.part_category"
            class="flex items-center justify-between text-sm">
            <span class="text-muted">
              {{ formatPartCategory(item.part_category) }}
            </span>

            <span class="font-semibold">
              {{ formatCurrency(item.inventory_value || 0) }}
            </span>
          </div>
        </div>
      </div>
    </UCard>

    <UCard>
      <p class="text-sm text-muted">
        Total Kanban
      </p>

      <p class="text-3xl font-bold mt-2">
        {{ executiveSummary.total_kanban || 0 }}
      </p>
    </UCard>

    <UCard>
      <p class="text-sm text-muted">
        Total PCS
      </p>

      <p class="text-3xl font-bold mt-2">
        {{ executiveSummary.total_pcs || 0 }}
      </p>
    </UCard>

    <UCard>
      <p class="text-sm text-muted">
        Low Stock Parts
      </p>

      <p class="text-3xl font-bold mt-2 text-error">
        {{ executiveSummary.low_stock_parts || 0 }}
      </p>
    </UCard>

    <UCard>
      <p class="text-sm text-muted">
        Warehouse Utilization
      </p>

      <p class="text-3xl font-bold mt-2">
        {{ utilizationPercentage }}%
      </p>

      <UProgress :model-value="utilizationPercentage" class="mt-3" />
    </UCard>
  </div>
</template>