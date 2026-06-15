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
  actual_quantity:          '',
  under_production_reason:  '',
})

const currentGoodQty = computed(() =>
  props.wo.cumulative_qty_good ?? props.wo.actual_quantity ?? 0,
)

const maxAllowed = computed(() => Math.ceil(props.wo.planned_quantity * 1.1))

const isUnder = computed(() => form.actual_quantity < props.wo.planned_quantity && form.actual_quantity > 0)

const completionPct = computed(() => {
  if (!props.wo.planned_quantity) return 0
  return Math.round((form.actual_quantity / props.wo.planned_quantity) * 100)
})

watch(() => props.open, (v) => {
  if (v) {
    form.actual_quantity         = currentGoodQty.value
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
    errors.actual_quantity = `Actual quantity (${form.actual_quantity}) exceeds 110% of planned (max: ${maxAllowed.value}).`
    return false
  }
  if (isUnder.value && !form.under_production_reason.trim()) {
    errors.under_production_reason = 'Reason is required when actual qty is less than planned.'
    return false
  }
  return true
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    actual_quantity:          form.actual_quantity,
    under_production_reason:  isUnder.value ? form.under_production_reason.trim() : null,
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

        <!-- Current progress summary -->
        <div class="grid grid-cols-3 gap-3 p-4 bg-elevated rounded-lg">
          <div class="text-center">
            <p class="text-xs text-muted mb-1">Planned</p>
            <p class="text-lg font-bold font-mono">{{ wo.planned_quantity.toLocaleString() }}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-muted mb-1">Good Qty (Progress)</p>
            <p
              class="text-lg font-bold font-mono"
              :class="{
                'text-success-600': currentGoodQty >= wo.planned_quantity,
                'text-warning-600': currentGoodQty > 0 && currentGoodQty < wo.planned_quantity,
                'text-error-600':   currentGoodQty === 0,
              }"
            >
              {{ currentGoodQty.toLocaleString() }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-xs text-muted mb-1">Achievement</p>
            <p
              class="text-lg font-bold font-mono"
              :class="{
                'text-success-600': completionPct >= 100,
                'text-warning-600': completionPct >= 80 && completionPct < 100,
                'text-error-600':   completionPct < 80,
              }"
            >
              {{ completionPct }}%
            </p>
          </div>
        </div>

        <!-- Actual Quantity input -->
        <UFormField
          label="Actual Quantity (Final)"
          :error="errors.actual_quantity"
          required
          description="Enter the final actual quantity produced. Maximum 110% of planned."
        >
          <UInput
            v-model.number="form.actual_quantity"
            type="number"
            :min="1"
            :max="maxAllowed"
            class="w-full font-mono"
          />
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
            placeholder="Explain why actual qty is less than planned..."
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <UAlert
          color="error"
          variant="soft"
          icon="i-lucide-alert-triangle"
          description="Completing this Work Order is irreversible. All stations will be marked as Completed."
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