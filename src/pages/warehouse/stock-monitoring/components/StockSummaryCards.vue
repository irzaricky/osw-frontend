<script setup lang="ts">
import type { StockMonitoringSummary } from '../../../../types/warehouse/stock-monitoring'

defineProps<{
  summary: StockMonitoringSummary | null
}>()

const cards = [
  { key: 'total_kanban', label: 'Total Kanban', icon: 'i-lucide-package' },
  { key: 'total_pcs', label: 'Total PCS', icon: 'i-lucide-boxes' },
  { key: 'total_parts', label: 'Parts in Stock', icon: 'i-lucide-cog' },
  { key: 'occupied_bins', label: 'Occupied Bins', icon: 'i-lucide-warehouse' },
  { key: 'full_bins', label: 'Full Bins', icon: 'i-lucide-circle-alert' },
  { key: 'empty_bins', label: 'Empty Bins', icon: 'i-lucide-circle' },
  { key: 'low_capacity_bins', label: 'Low Capacity Bins', icon: 'i-lucide-triangle-alert' }
] as const
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    <UCard
      v-for="card in cards"
      :key="card.key"
    >
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-sm text-muted">
            {{ card.label }}
          </p>
          <p class="text-2xl font-bold">
            {{ summary?.[card.key] ?? 0 }}
          </p>
        </div>

        <UIcon
          :name="card.icon"
          class="size-8 text-muted"
        />
      </div>
    </UCard>
  </div>
</template>