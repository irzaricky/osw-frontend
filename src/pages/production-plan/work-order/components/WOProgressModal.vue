<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { WorkOrder, AddProgressPayload } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  open:    boolean
  wo:      WorkOrder
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  'submit':      [payload: AddProgressPayload]
}>()

const form = reactive({
  cumulative_qty: 0,
  reported_by:    '',
})

const errors = reactive({
  cumulative_qty: '',
  reported_by:    '',
})

watch(() => props.open, (v) => {
  if (v) {
    form.cumulative_qty = props.wo.actual_quantity
    form.reported_by    = ''
    errors.cumulative_qty = ''
    errors.reported_by    = ''
  }
})

const progressPct = computed(() => {
  if (!props.wo.planned_quantity) return 0
  return Math.min(100, Math.round((form.cumulative_qty / props.wo.planned_quantity) * 100))
})

const maxAllowed = computed(() => props.wo.planned_quantity)

function validate(): boolean {
  let valid = true
  errors.cumulative_qty = ''
  errors.reported_by    = ''

  if (form.cumulative_qty < props.wo.actual_quantity) {
    errors.cumulative_qty = `Cannot be less than current actual quantity (${props.wo.actual_quantity}). Progress cannot go backward.`
    valid = false
  }
  if (form.cumulative_qty > props.wo.planned_quantity) {
    errors.cumulative_qty = `Cannot exceed planned quantity (${props.wo.planned_quantity}). Use Complete WO to finalize.`
    valid = false
  }
  if (!form.reported_by.trim()) {
    errors.reported_by = 'Reporter name is required.'
    valid = false
  }
  return valid
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    cumulative_qty: form.cumulative_qty,
    reported_by:    form.reported_by.trim(),
  })
}
</script>

<template>
  <UModal
    :open="open"
    title="Report Progress"
    description="Record cumulative production quantity for this Work Order."
    :ui="{ content: 'sm:max-w-md' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Current status -->
        <div class="flex items-center justify-between p-3 bg-elevated rounded-lg text-sm">
          <span class="text-muted">Current Actual Qty</span>
          <span class="font-mono font-semibold">{{ wo.actual_quantity.toLocaleString() }} / {{ wo.planned_quantity.toLocaleString() }}</span>
        </div>

        <!-- Cumulative Qty -->
        <UFormField label="Cumulative Quantity" :error="errors.cumulative_qty" required>
          <UInput
            v-model.number="form.cumulative_qty"
            type="number"
            :min="wo.actual_quantity"
            :max="maxAllowed"
            placeholder="Enter cumulative quantity..."
            class="w-full font-mono"
          />
          <template #hint>
            <span class="text-xs text-muted">
              Range: {{ wo.actual_quantity }} – {{ wo.planned_quantity }}
              <span class="ml-2 font-semibold">{{ progressPct }}%</span>
            </span>
          </template>
        </UFormField>

        <!-- Progress preview -->
        <div class="h-1.5 w-full bg-elevated rounded-full overflow-hidden">
          <div
            class="h-full bg-primary rounded-full transition-all duration-300"
            :style="{ width: `${progressPct}%` }"
          />
        </div>

        <!-- Reported By -->
        <UFormField label="Reported By" :error="errors.reported_by" required>
          <UInput
            v-model="form.reported_by"
            placeholder="Your name or employee ID..."
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-2 w-full">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="emit('update:open', false)" />
        <UButton
          label="Record Progress"
          icon="i-lucide-trending-up"
          color="primary"
          :loading="loading"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>