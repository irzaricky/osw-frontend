<script setup lang="ts">
import type { WorkOrder } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  open:    boolean
  wo:      WorkOrder
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  'confirm':     []
}>()

function fmtDate(d?: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <UModal
    :open="open"
    title="Start Work Order"
    description="Confirm to start this Work Order. Status will change to In Progress."
    :ui="{ content: 'sm:max-w-md' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3 p-4 bg-elevated rounded-lg">
          <div>
            <p class="text-xs text-muted">
              WO Number
            </p>
            <p class="text-sm font-semibold font-mono">
              {{ wo.wo_number }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted">
              Work Date
            </p>
            <p class="text-sm font-semibold">
              {{ fmtDate(wo.work_date) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted">
              Part
            </p>
            <p class="text-sm font-semibold">
              {{ wo.part?.part_name ?? '-' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted">
              Planned Qty
            </p>
            <p class="text-sm font-semibold font-mono">
              {{ wo.planned_quantity.toLocaleString() }}
            </p>
          </div>
        </div>

        <UAlert
          color="info"
          variant="soft"
          icon="i-lucide-info"
          description="Only the first process station will be activated. Subsequent stations remain Pending until the active station is completed."
        />
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-2 w-full">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          @click="emit('update:open', false)"
        />
        <UButton
          label="Start Work Order"
          icon="i-lucide-play"
          color="primary"
          :loading="loading"
          @click="emit('confirm')"
        />
      </div>
    </template>
  </UModal>
</template>