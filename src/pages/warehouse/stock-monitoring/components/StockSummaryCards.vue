<script setup lang="ts">
import type { StockMonitoringSummary } from '../../../../types/warehouse/stock-monitoring'

defineProps<{
  summary: StockMonitoringSummary | null
}>()

const emit = defineEmits<{
  clickCard: [type: string]
}>()

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <UCard class="cursor-pointer hover:bg-elevated/50 transition" @click="emit('clickCard', 'all_parts')">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm text-muted">
              Total Kanban
            </p>
            <p class="text-2xl font-bold">
              {{ summary?.total_kanban ?? 0 }}
            </p>
            <p class="text-xs text-muted mt-2">
              All active stock labels
            </p>
          </div>
          <UIcon name="i-lucide-package" class="size-8 text-muted" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm text-muted">
              Total PCS
            </p>
            <p class="text-2xl font-bold">
              {{ summary?.total_pcs ?? 0 }}
            </p>
            <p class="text-xs text-muted mt-2">
              Calculated from package capacity
            </p>
          </div>
          <UIcon name="i-lucide-boxes" class="size-8 text-muted" />
        </div>
      </UCard>

      <UCard class="cursor-pointer hover:bg-elevated/50 transition" @click="emit('clickCard', 'all_parts')">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm text-muted">
              Parts in Stock
            </p>
            <p class="text-2xl font-bold">
              {{ summary?.total_parts ?? 0 }}
            </p>
            <p class="text-xs text-muted mt-2">
              Unique part variants
            </p>
          </div>
          <UIcon name="i-lucide-cog" class="size-8 text-muted" />
        </div>
      </UCard>

      <UCard class="cursor-pointer hover:bg-elevated/50 transition" @click="emit('clickCard', 'occupied_bins')">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm text-muted">
              Occupied Bins
            </p>
            <p class="text-2xl font-bold">
              {{ summary?.occupied_bins ?? 0 }}
            </p>
            <p class="text-xs text-muted mt-2">
              Bins currently storing stock
            </p>
          </div>
          <UIcon name="i-lucide-warehouse" class="size-8 text-muted" />
        </div>
      </UCard>

      <UCard
        class="cursor-pointer hover:bg-warning/5 transition border-warning/20"
        @click="emit('clickCard', 'low_stock')"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-sm text-muted">
              Low Stock Parts
            </p>
            <p class="text-2xl font-bold">
              {{ summary?.low_stock_parts ?? 0 }}
            </p>

            <p class="text-xs text-muted mt-2">
              Click to view highlighted low stock parts
            </p>
          </div>

          <UIcon name="i-lucide-triangle-alert" class="size-8 text-warning" />
        </div>
      </UCard>

      <UCard class="cursor-pointer hover:bg-warning/5 transition border-warning/20" @click="emit('clickCard', 'aging')">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-sm text-muted">
              Stock &gt; 7 Days
            </p>
            <p class="text-2xl font-bold">
              {{ summary?.stock_aging_7_days ?? 0 }}
            </p>

            <p class="text-xs text-muted mt-2">
              Click to view highlighted aging stock
            </p>
          </div>

          <UIcon name="i-lucide-clock" class="size-8 text-warning" />
        </div>
      </UCard>

      <UCard class="cursor-pointer hover:bg-error/5 transition border-error/20" @click="emit('clickCard', 'full_bins')">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-sm text-muted">
              Full Bins
            </p>
            <p class="text-2xl font-bold">
              {{ summary?.full_bins ?? 0 }}
            </p>

            <div class="mt-2 space-y-1">
              <!-- <p v-for="bin in summary?.full_bin_preview || []" :key="bin.bin_code" class="text-xs truncate">
                <span class="font-medium">{{ bin.bin_code }}</span>
                <span class="text-muted">
                  — {{ bin.used_capacity }}/{{ bin.capacity }}
                </span>
              </p> -->

              <p v-if="!(summary?.full_bin_preview || []).length" class="text-xs text-muted">
                No full bin
              </p>
            </div>
          </div>

          <UIcon name="i-lucide-square-x" class="size-8 text-error" />
        </div>
      </UCard>

      <UCard
        class="cursor-pointer hover:bg-warning/5 transition border-warning/20"
        @click="emit('clickCard', 'low_capacity')"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-sm text-muted">
              Low Capacity Bins
            </p>
            <p class="text-2xl font-bold">
              {{ summary?.low_capacity_bins ?? 0 }}
            </p>

            <div class="mt-2 space-y-1">
              <p v-for="bin in summary?.low_capacity_preview || []" :key="bin.bin_code" class="text-xs truncate">
                <span class="font-medium">{{ bin.bin_code }}</span>
                <span class="text-muted">
                  — remaining {{ bin.remaining_capacity }}
                </span>
              </p>

              <p v-if="!(summary?.low_capacity_preview || []).length" class="text-xs text-muted">
                No low capacity bin
              </p>
            </div>
          </div>

          <UIcon name="i-lucide-circle-alert" class="size-8 text-warning" />
        </div>
      </UCard>

      <UCard class="cursor-pointer hover:bg-elevated/50 transition" @click="emit('clickCard', 'empty_bins')">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm text-muted">
              Empty Bins
            </p>
            <p class="text-2xl font-bold">
              {{ summary?.empty_bins ?? 0 }}
            </p>
            <p class="text-xs text-muted mt-2">
              Available for placement
            </p>
          </div>
          <UIcon name="i-lucide-square" class="size-8 text-muted" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm text-muted">
              Stock &gt; 30 Days
            </p>
            <p class="text-2xl font-bold">
              {{ summary?.stock_aging_30_days ?? 0 }}
            </p>
            <p class="text-xs text-muted mt-2">
              Potential dead stock
            </p>
          </div>
          <UIcon name="i-lucide-hourglass" class="size-8 text-muted" />
        </div>
      </UCard>
    </div>

    <UAlert
      v-if="summary?.oldest_stock_at"
      color="warning"
      variant="soft"
      icon="i-lucide-clock"
      title="Oldest Stock"
      :description="`Oldest active stock placement: ${formatDate(summary.oldest_stock_at)}`"
    />
  </div>
</template>