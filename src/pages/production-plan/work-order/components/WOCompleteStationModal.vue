<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type {
  WorkOrderStationDetail,
  WorkOrder,
  CompleteStationPayload,
} from '../../../../types/production-plan/work-order'

const props = defineProps<{
  open:           boolean
  station:        WorkOrderStationDetail
  parentWo:       WorkOrder | null
  cumulativeGood: number   // total good yang sudah dilaporkan via progress
  loading:        boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  'submit':      [payload: CompleteStationPayload]
}>()

const form = reactive({ under_production_reason: '' })
const errors = reactive({ under_production_reason: '' })

const plannedQty  = computed(() => props.station.planned_quantity ?? 0)
// actual_quantity dikunci ke cumulativeGood — tidak bisa diubah user
const actualQty   = computed(() => props.cumulativeGood)
const isUnder     = computed(() => actualQty.value < plannedQty.value)
const completionPct = computed(() => {
  if (!plannedQty.value) return 0
  return Math.round((actualQty.value / plannedQty.value) * 100)
})

watch(() => props.open, (v) => {
  if (v) {
    form.under_production_reason = ''
    errors.under_production_reason = ''
  }
})

function validate(): boolean {
  errors.under_production_reason = ''
  if (isUnder.value && !form.under_production_reason.trim()) {
    errors.under_production_reason = 'Reason is required when actual qty is below planned.'
    return false
  }
  return true
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    actual_quantity:         actualQty.value,
    under_production_reason: isUnder.value ? form.under_production_reason.trim() : null,
  })
}
</script>

<template>
  <UModal
    :open="open"
    title="Complete Station"
    description="Finalize this station. All progress must be reported before completing."
    :ui="{ content: 'sm:max-w-md' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">

        <!-- Summary cards -->
        <div class="grid grid-cols-3 gap-3 p-4 bg-elevated rounded-lg">
          <div class="text-center">
            <p class="text-xs text-muted mb-1">Planned</p>
            <p class="text-lg font-bold font-mono">{{ plannedQty.toLocaleString() }}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-muted mb-1">Good Reported</p>
            <p
              class="text-lg font-bold font-mono"
              :class="actualQty >= plannedQty ? 'text-success-600' : 'text-warning-600'"
            >
              {{ actualQty.toLocaleString() }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-xs text-muted mb-1">Completion</p>
            <p
              class="text-lg font-bold font-mono"
              :class="actualQty >= plannedQty ? 'text-success-600' : 'text-warning-600'"
            >
              {{ completionPct }}%
            </p>
          </div>
        </div>

        <div class="text-sm text-muted">
          Station: <span class="font-semibold text-default">{{ station.station?.name }}</span>
          <span v-if="station.wo_station_number" class="font-mono ml-1">({{ station.wo_station_number }})</span>
        </div>

        <!-- actual_quantity tidak bisa diubah — dikunci dari cumulative progress -->
        <div class="p-3 bg-elevated rounded-lg flex items-center justify-between">
          <span class="text-sm text-muted">Actual Quantity (locked)</span>
          <span class="font-mono font-bold text-lg">{{ actualQty.toLocaleString() }}</span>
        </div>

        <div v-if="isUnder">
          <label class="block text-sm font-medium mb-1.5">
            Under-Production Reason <span class="text-error-500">*</span>
          </label>
          <UTextarea
            v-model="form.under_production_reason"
            placeholder="Explain why actual quantity is below planned..."
            :rows="3"
            class="w-full"
          />
          <p v-if="errors.under_production_reason" class="text-xs text-error-500 mt-1">
            {{ errors.under_production_reason }}
          </p>
        </div>

        <UAlert
          color="info"
          variant="soft"
          icon="i-lucide-info"
          description="Actual quantity is automatically set from your reported progress. If this is the last station, the Work Order will complete automatically."
        />
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-2 w-full">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="emit('update:open', false)" />
        <UButton
          label="Complete Station"
          icon="i-lucide-check-circle"
          color="success"
          :loading="loading"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>