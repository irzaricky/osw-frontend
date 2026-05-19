<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { ReschedulePayload } from '../../../../types/production-plan/order-schedule'

const props = defineProps<{
  open:        boolean
  currentStart: string
  currentEnd:   string
  saving:       boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm':     [payload: ReschedulePayload]
}>()

const form = reactive({
  new_start_date:    '',
  new_end_date:      '',
  reschedule_reason: '',
})

watch(
  () => props.open,
  (open) => {
    if (!open) return
    form.new_start_date    = props.currentStart
    form.new_end_date      = props.currentEnd
    form.reschedule_reason = ''
  },
)

function handleConfirm() {
  if (!form.new_start_date || !form.new_end_date || !form.reschedule_reason.trim()) return
  emit('confirm', {
    new_start_date:    form.new_start_date,
    new_end_date:      form.new_end_date,
    reschedule_reason: form.reschedule_reason.trim(),
  })
}

const isValid =
  form.new_start_date &&
  form.new_end_date &&
  form.new_end_date >= form.new_start_date &&
  form.reschedule_reason.trim()
</script>

<template>
  <UModal :open="open" @update:open="emit('update:open', $event)">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-calendar-clock" class="w-5 h-5 text-warning-500" />
        <span class="font-semibold">Reschedule Production Order</span>
      </div>
    </template>

    <div class="space-y-4 py-2">
      <UAlert
        color="warning"
        variant="soft"
        icon="i-lucide-alert-triangle"
        title="This will affect Work Orders"
        description="Changing the PO date range will impact all non-completed Work Orders linked to this order."
      />

      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Current Start">
          <UInput :model-value="currentStart" type="date" disabled class="w-full" />
        </UFormField>
        <UFormField label="Current End">
          <UInput :model-value="currentEnd" type="date" disabled class="w-full" />
        </UFormField>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <UFormField label="New Start Date" required>
          <UInput v-model="form.new_start_date" type="date" class="w-full" />
        </UFormField>
        <UFormField label="New End Date" required>
          <UInput
            v-model="form.new_end_date"
            type="date"
            :min="form.new_start_date"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField label="Reason for Reschedule" required>
        <UTextarea
          v-model="form.reschedule_reason"
          placeholder="Explain why this reschedule is necessary..."
          :rows="3"
          class="w-full"
        />
      </UFormField>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          @click="emit('update:open', false)"
        />
        <UButton
          label="Confirm Reschedule"
          icon="i-lucide-calendar-clock"
          color="warning"
          :loading="saving"
          :disabled="!form.new_start_date || !form.new_end_date || !form.reschedule_reason.trim()"
          @click="handleConfirm"
        />
      </div>
    </template>
  </UModal>
</template>