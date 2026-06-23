<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type {
  WorkOrderStationDetail,
  WorkOrder,
  CompleteStationPayload,
} from '../../../../types/production-plan/work-order'

const props = defineProps<{
  open:     boolean
  station:  WorkOrderStationDetail
  parentWo: WorkOrder | null
  loading:  boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  'submit':      [payload: CompleteStationPayload]
}>()

const form = reactive({
  actual_quantity:         0,
  under_production_reason: '',
})

const errors = reactive({
  actual_quantity:         '',
  under_production_reason: '',
})

const plannedQty  = computed(() => props.station.planned_quantity ?? 0)
const maxAllowed  = computed(() => Math.ceil(plannedQty.value * 1.1))
const currentQty  = computed(() => props.station.actual_quantity ?? 0)
const isUnder     = computed(() => form.actual_quantity > 0 && form.actual_quantity < plannedQty.value)

const completionPct = computed(() => {
  if (!plannedQty.value) return 0
  return Math.round((form.actual_quantity / plannedQty.value) * 100)
})

watch(() => props.open, (v) => {
  if (v) {
    form.actual_quantity         = currentQty.value
    form.under_production_reason = ''
    errors.actual_quantity         = ''
    errors.under_production_reason = ''
  }
})

function validate(): boolean {
  errors.actual_quantity         = ''
  errors.under_production_reason = ''

  if (!form.actual_quantity || form.actual_quantity < 1) {
    errors.actual_quantity = 'Actual quantity must be at least 1.'
    return false
  }
  if (form.actual_quantity > maxAllowed.value) {
    errors.actual_quantity = `Exceeds 110% of planned (max: ${maxAllowed.value}).`
    return false
  }
  if (isUnder.value && !form.under_production_reason.trim()) {
    errors.under_production_reason = 'Reason is required when actual qty is below planned.'
    return false
  }
  return true
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    actual_quantity:         form.actual_quantity,
    under_production_reason: isUnder.value ? form.under_production_reason.trim() : null,
  })
}
</script>

<template>
  <UModal
    :open="open"
    title="Complete Station"
    description="Finalize this station. If all stations are done, the Work Order will complete automatically."
    :ui="{ content: 'sm:max-w-md' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">

        <!-- Station summary -->
        <div class="grid grid-cols-3 gap-3 p-4 bg-elevated rounded-lg">
          <div class="text-center">
            <p class="text-xs text-muted mb-1">Planned</p>
            <p class="text-lg font-bold font-mono">{{ plannedQty.toLocaleString() }}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-muted mb-1">Current</p>
            <p class="text-lg font-bold font-mono text-warning-600">{{ currentQty.toLocaleString() }}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-muted mb-1">Completing As</p>
            <p
              class="text-lg font-bold font-mono"
              :class="form.actual_quantity >= plannedQty ? 'text-success-600' : 'text-warning-600'"
            >
              {{ form.actual_quantity > 0 ? `${completionPct}%` : '-' }}
            </p>
          </div>
        </div>

        <!-- Station name context -->
        <div class="text-sm text-muted">
          Station: <span class="font-semibold text-default">{{ station.station?.name }}</span>
          <span v-if="station.wo_station_number" class="font-mono ml-1">({{ station.wo_station_number }})</span>
        </div>

        <!-- Actual quantity input -->
        <div>
          <label class="block text-sm font-medium mb-1.5">Actual Quantity <span class="text-error-500">*</span></label>
          <UInput
            v-model.number="form.actual_quantity"
            type="number"
            :min="1"
            :max="maxAllowed"
            placeholder="Enter actual quantity produced"
            class="w-full"
          />
          <p v-if="errors.actual_quantity" class="text-xs text-error-500 mt-1">{{ errors.actual_quantity }}</p>
          <p class="text-xs text-muted mt-1">Max allowed: {{ maxAllowed.toLocaleString() }} (110% of planned)</p>
        </div>

        <!-- Under-production reason -->
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
          <p v-if="errors.under_production_reason" class="text-xs text-error-500 mt-1">{{ errors.under_production_reason }}</p>
        </div>

        <UAlert
          color="info"
          variant="soft"
          icon="i-lucide-info"
          description="If this is the last station to complete, the Work Order will be automatically marked as Completed."
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