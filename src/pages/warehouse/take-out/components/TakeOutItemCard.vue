<script setup lang="ts">
import type { TakeOutItem } from '../../../../types/warehouse/take-out'
import TakeOutProgress from './TakeOutProgress.vue'

defineProps<{
  item: TakeOutItem
}>()
</script>

<template>
  <div class="rounded-xl border border-default p-4 space-y-3">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="font-semibold">
          {{ item.part_number }}
        </p>
        <p class="text-sm text-muted">
          {{ item.part_name }}
        </p>
        <p class="text-xs text-muted">
          {{ item.part_category || '-' }}
        </p>
        <p class="text-xs text-muted">
          Package: {{ item.package_name || item.package_code || '-' }}
        </p>
        <p class="text-xs text-muted">
          Capacity: {{ item.capacity_per_kanban || 0 }} pcs / kanban
        </p>
      </div>

      <UBadge variant="soft" color="primary">
        {{ item.total_scanned_out }} / {{ item.total_label }}
      </UBadge>
    </div>

    <TakeOutProgress
      :total="item.total_label"
      :scanned="item.total_scanned_out"
      :progress="item.progress"
      :total-pcs="item.total_pcs"
      :scanned-pcs="item.scanned_out_pcs"
    />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      <div
        v-for="label in item.labels"
        :key="label.wo_item_label_id"
        class="rounded-lg border border-default p-2 text-sm flex items-center justify-between gap-2"
      >
        <span class="truncate">
          {{ label.label_number }}
        </span>

        <UBadge
          size="sm"
          variant="soft"
          :color="label.is_scanned_out ? 'success' : 'neutral'"
        >
          {{ label.is_scanned_out ? 'Taken Out' : 'Pending' }}
        </UBadge>
      </div>
    </div>
  </div>
</template>