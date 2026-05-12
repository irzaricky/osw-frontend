<script setup lang="ts">
defineProps<{
  items: any[]
}>()

function formatCurrency(value: any) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <UCard
      v-for="item in items"
      :key="item.inventory_type"
    >
      <p class="text-sm text-muted">
        {{ item.inventory_type }}
      </p>

      <p class="text-2xl font-bold mt-2">
        {{ formatCurrency(item.total_cost) }}
      </p>

      <div class="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p class="text-muted">Parts</p>
          <p class="font-semibold">{{ item.total_parts }}</p>
        </div>

        <div>
          <p class="text-muted">Kanban</p>
          <p class="font-semibold">{{ item.total_kanban }}</p>
        </div>

        <div>
          <p class="text-muted">PCS</p>
          <p class="font-semibold">{{ item.total_pcs }}</p>
        </div>

        <div>
          <p class="text-muted">Main Area</p>
          <p class="font-semibold truncate">{{ item.dominant_area || '-' }}</p>
        </div>
      </div>
    </UCard>

    <UCard v-if="!items.length">
      <p class="text-sm text-muted">
        Inventory Cost by Type
      </p>
      <p class="text-sm mt-2">
        No data available.
      </p>
    </UCard>
  </div>
</template>