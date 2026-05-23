<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { WorkOrder, CompleteWorkOrderPayload } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  open:    boolean
  wo:      WorkOrder
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  'submit':      [payload: CompleteWorkOrderPayload]
}>()

const form = reactive({
  actual_quantity:          0,
  under_production_reason:  '',
})

const errors = reactive({
  actual_quantity:         '',
  under_production_reason: '',
})

watch(() => props.open, (v) => {
  if (v) {
    form.actual_quantity         = props.wo.actual_quantity || props.wo.planned_quantity
    form.under_production_reason = ''
    errors.actual_quantity         = ''
    errors.under_production_reason = ''
  }
})

const maxAllowed    = computed(() => Math.ceil(props.wo.planned_quantity * 1.1))
const isUnder       = computed(() => form.actual_quantity < props.wo.planned_quantity)
const isOver        = computed(() => form.actual_quantity > props.wo.planned_quantity)
const progressPct   = computed(() => {
  if (!props.wo.planned_quantity) return 0
  return Math.round((form.actual_quantity / props.wo.planned_quantity) * 100)
})

function validate(): boolean {
  let valid = true
  errors.actual_quantity         = ''
  errors.under_production_reason = ''

  if (form.actual_quantity < 1) {
    errors.actual_quantity = 'Actual quantity must be at least 1.'
    valid = false
  }
  if (form.actual_quantity > maxAllowed.value) {
    errors.actual_quantity = `Actual quantity cannot exceed 110% of planned (max: ${maxAllowed.value}).`
    valid = false
  }
  if (isUnder.value && !form.under_production_reason.trim()) {
    errors.under_production_reason = 'Reason is required when actual quantity is less than planned.'
    valid = false
  }
  return valid
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    actual_quantity:          form.actual_quantity,
    under_production_reason:  isUnder.value ? form.under_production_reason.trim() : undefined,
  })
}
</script>

<template>
  <UModal
    :open="open"
    title="Complete Work Order"
    description="Finalize and complete this Work Order. This action cannot be undone."
    :ui="{ content: 'sm:max-w-md' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Summary -->
        <div class="grid grid-cols-2 gap-3 p-3 bg-elevated rounded-lg text-sm">
          <div>
            <p class="text-xs text-muted">Planned Qty</p>
            <p class="font-mono font-semibold">{{ wo.planned_quantity.toLocaleString() }}</p>
          </div>
          <div>
            <p class="text-xs text-muted">Max Allowed (110%)</p>
            <p class="font-mono font-semibold">{{ maxAllowed.toLocaleString() }}</p>
          </div>
        </div>

        <!-- Actual Quantity -->
        <UFormField label="Final Actual Quantity" :error="errors.actual_quantity" required>
          <UInput
            v-model.number="form.actual_quantity"
            type="number"
            :min="1"
            :max="maxAllowed"
            class="w-full font-mono"
          />
          <template #hint>
            <span class="text-xs" :class="{
              'text-success-600': progressPct >= 100,
              'text-warning-600': progressPct >= 80 && progressPct < 100,
              'text-error-600':   progressPct < 80,
            }">
              {{ progressPct }}% of planned
              <span v-if="isOver" class="ml-1 text-warning-600">(Over-production)</span>
            </span>
          </template>
        </UFormField>

        <!-- Under-production reason -->
        <UFormField
          v-if="isUnder"
          label="Under-Production Reason"
          :error="errors.under_production_reason"
          required
        >
          <UTextarea
            v-model="form.under_production_reason"
            placeholder="Explain why actual quantity is less than planned..."
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <!-- Warning -->
        <UAlert
          color="error"
          variant="soft"
          icon="i-lucide-alert-triangle"
          description="Completing this Work Order is irreversible. All stations and jobs will be marked as Completed. The Production Order will be auto-completed if all Work Orders are done."
        />
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-2 w-full">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="emit('update:open', false)" />
        <UButton
          label="Complete Work Order"
          icon="i-lucide-check-circle"
          color="success"
          :loading="loading"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>