<script setup lang="ts">
import { ref, reactive } from 'vue'
import { z } from 'zod'
import type { RejectPOPayload } from '../../../../types/production-plan/order-schedule'

const props = defineProps<{
  open: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [payload: RejectPOPayload]
}>()

const formRef = ref()

const state = reactive({
  notes: '',
})

const schema = z.object({
  notes: z
    .string()
    .min(10, 'Please provide a rejection reason of at least 10 characters.'),
})

async function onConfirm() {
  try {
    await formRef.value.validate()

    emit('confirm', {
      notes: state.notes,
    })
  } catch (error) {
    console.error('Validation failed:', error)
  }
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Reject Production Order"
    :ui="{ content: 'max-w-md' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        class="space-y-4"
      >
        <UAlert
          icon="i-lucide-alert-triangle"
          color="error"
          variant="soft"
          title="You are about to reject this production order."
          description="The order will be returned to Draft status so the staff can revise and resubmit."
        />

        <UFormField
          label="Rejection Reason"
          name="notes"
          required
        >
          <UTextarea
            v-model="state.notes"
            placeholder="Describe why this production order is being rejected..."
            :rows="4"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            color="neutral"
            variant="outline"
            label="Cancel"
            :disabled="props.loading"
            @click="emit('update:open', false)"
          />

          <UButton
            color="error"
            variant="solid"
            label="Reject"
            :loading="props.loading"
            type="submit"
            @click="onConfirm"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>