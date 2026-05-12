<script setup lang="ts">
import type { WarehouseLayout } from '../../../../types/warehouse/warehouse-layout'
import WarehouseLayoutProgress from './WarehouseLayoutProgress.vue'

defineProps<{
  warehouseLayout: WarehouseLayout
}>()

const emit = defineEmits<{
  detail: [id: number]
}>()

function getCategoryColor(category?: string) {
  if (category === 'Raw Materials') return 'secondary'
  if (category === 'WIP') return 'warning'
  if (category === 'Finish Good') return 'primary'
  return 'neutral'
}
</script>

<template>
  <UCard class="hover:shadow-md transition duration-200">
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm text-muted">Warehouse Code</p>
          <p class="text-lg font-bold">{{ warehouseLayout.warehouse?.warehouse_code || '-' }}</p>
        </div>

        <UBadge :color="getCategoryColor(warehouseLayout.warehouse?.category?.name)" variant="soft">
          {{ warehouseLayout.warehouse?.category?.name || 'No Category' }}
        </UBadge>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-muted">Warehouse Name</p>
          <p class="font-semibold">{{ warehouseLayout.warehouse?.name || '-' }}</p>
        </div>

        <div>
          <p class="text-muted">Total Area</p>
          <p class="font-semibold">{{ warehouseLayout.total_area_count }}</p>
        </div>
      </div>

      <WarehouseLayoutProgress
        :total="warehouseLayout.total_area_count"
        :placed="warehouseLayout.placed_area_count"
        :progress="
          warehouseLayout.total_area_count > 0
            ? (warehouseLayout.placed_area_count / warehouseLayout.total_area_count) * 100
            : 0
        "
      />

      <UButton
        block
        color="primary"
        icon="i-lucide-layout-grid"
        label="Manage Layout"
        @click="emit('detail', warehouseLayout.id)"
      />
    </div>
  </UCard>
</template>