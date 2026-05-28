<script setup lang="ts">
import { reactive, watch, ref } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

import type { GoodReceipt } from '../../../../types/warehouse/good-receipt'

const formRef = ref()

const props = defineProps<{
  open: boolean
  loading: boolean
  receipt: GoodReceipt | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: { remarks?: string }]
}>()

const state = reactive({
  remarks: ''
})

const schema = z.object({
  remarks: z.string().optional()
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      state.remarks = props.receipt?.gr_remarks || ''
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
    title="Approve Good Receipt"
    description="Confirm approval for this good receipt"
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
        <UFormField label="PO Number">
          <UInput
            :model-value="props.receipt?.po_number || '-'"
            disabled
            class="w-full"
          />
        </UFormField>

        <UFormField label="DO Number">
          <UInput
            :model-value="props.receipt?.do_number || '-'"
            disabled
            class="w-full"
          />
        </UFormField>

        <UFormField label="Remarks" name="remarks">
          <UInput
            v-model="state.remarks"
            placeholder="Input remarks (optional)"
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
          color="success"
          icon="i-lucide-check-check"
          label="Approve"
          :loading="props.loading"
          @click="submitForm"
        />
      </div>
    </template>
  </UModal>
</template>