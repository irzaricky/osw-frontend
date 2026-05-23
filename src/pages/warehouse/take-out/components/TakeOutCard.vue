<script setup lang="ts">
import type { TakeOut } from '../../../../types/warehouse/take-out'
import TakeOutProgress from './TakeOutProgress.vue'

defineProps<{
  takeOut: TakeOut
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
            {{ takeOut.wo_number }}
          </p>
        </div>

        <UBadge
          variant="soft"
          :color="getStatusColor(takeOut.status?.name)"
        >
          {{ takeOut.status?.name || '-' }}
        </UBadge>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-muted">
            Work Order Date
          </p>
          <p class="font-semibold">
            {{ takeOut.wo_date ? new Date(takeOut.wo_date).toLocaleDateString() : '-' }}
          </p>
        </div>

        <div>
          <p class="text-muted">
            Work Order Type
          </p>
          <p class="font-semibold">
            {{ takeOut.type?.name || '-' }}
          </p>
        </div>

        <div class="md:col-span-2">
          <p class="text-muted">
            Warehouse Area
          </p>
          <p class="font-semibold">
            {{ takeOut.area?.name || '-' }}
          </p>
        </div>
      </div>

      <TakeOutProgress
        :total="takeOut.total_label"
        :scanned="takeOut.total_scanned_out"
        :progress="takeOut.progress"
      />

      <UButton
        block
        color="primary"
        icon="i-lucide-eye"
        label="View Detail"
        @click="emit('detail', takeOut.wo_id)"
      />
    </div>
  </UCard>
</template>