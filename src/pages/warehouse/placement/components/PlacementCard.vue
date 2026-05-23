<script setup lang="ts">
import type { Placement } from '../../../../types/warehouse/placement'
import PlacementProgress from './PlacementProgress.vue'

defineProps<{
  placement: Placement
}>()

const emit = defineEmits<{
  detail: [id: number]
}>()

function getStatusColor(status?: string) {
  if (status === 'Completed') return 'success'
  if (status === 'In Progress') return 'warning'
  return 'primary'
}
</script>

<template>
  <UCard>
    <div class="space-y-4">
      <div class="flex justify-between gap-4">
        <div>
          <p class="text-sm text-muted">
            Work Order Number
          </p>
          <p class="font-bold">
            {{ placement.wo_number }}
          </p>
        </div>

        <UBadge
          variant="soft"
          :color="getStatusColor(placement.status?.name)"
        >
          {{ placement.status?.name || '-' }}
        </UBadge>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-muted">
            Work Order Date
          </p>
          <p class="font-semibold">
            {{ placement.wo_date ? new Date(placement.wo_date).toLocaleDateString() : '-' }}
          </p>
        </div>

        <div>
          <p class="text-muted">
            Work Order Type
          </p>
          <p class="font-semibold">
            {{ placement.type?.name || '-' }}
          </p>
        </div>

        <div class="md:col-span-2">
          <p class="text-muted">
            Warehouse Area
          </p>
          <p class="font-semibold">
            {{ placement.area?.name || '-' }}
          </p>
        </div>
      </div>

      <PlacementProgress
        :total="placement.total_label"
        :scanned="placement.total_scanned"
        :progress="placement.progress"
      />

      <UButton
        block
        color="primary"
        icon="i-lucide-eye"
        label="View Detail"
        @click="emit('detail', placement.wo_id)"
      />
    </div>
  </UCard>
</template>