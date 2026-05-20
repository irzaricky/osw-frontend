<script setup lang="ts">
import { reactive, watch, ref } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { QuantityCheckingLabel } from '../../../../types/warehouse/material-receiving'

const formRef = ref()

const props = defineProps<{
  open: boolean
  loading: boolean
  label: QuantityCheckingLabel | null
  qtyPerKanban: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: { actual_qty: number }]
}>()

const state = reactive({
  actual_qty: 0
})

const schema = z.object({
  actual_qty: z
    .number({
      message: 'Actual quantity is required'
    })
    .min(0, {
      message: 'Actual quantity cannot be less than 0'
    })
    .max(props.qtyPerKanban - 1, {
      message: 'Actual quantity must be less than qty per kanban'
    })
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      state.actual_qty = props.qtyPerKanban > 0 ? props.qtyPerKanban - 1 : 0
    }
  }
)

function submitForm() {
  formRef.value?.submit()
}

function onSubmit(event: FormSubmitEvent<any>) {
  emit('save', event.data)
  emit('update:open', false)
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Mark Quantity Incomplete"
    description="Adjust actual quantity for this scanned label"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >

        <UFormField label="Label Number">
          <UInput :model-value="props.label?.label_number || '-'" disabled class="w-full" />
        </UFormField>

        <UFormField label="Qty per Kanban">
          <UInput :model-value="props.qtyPerKanban" disabled class="w-full" />
        </UFormField>

        <UFormField label="Actual Qty" name="actual_qty" required>
          <UInput
            v-model.number="state.actual_qty"
            type="number"
            :min="0"
            :max="props.qtyPerKanban - 1"
            class="w-full"
          />
        </UFormField>

      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancel"
          @click="close"
        />

        <UButton
          color="warning"
          label="Submit"
          :loading="props.loading"
          @click="submitForm"
        />
      </div>
    </template>
  </UModal>
</template>