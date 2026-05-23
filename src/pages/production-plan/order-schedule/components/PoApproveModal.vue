<script setup lang="ts">
import { reactive } from 'vue'
import type { ApprovePOPayload } from '../../../../types/production-plan/order-schedule'

const props = defineProps<{
  open:    boolean
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm:       [payload: ApprovePOPayload]
}>()

const state = reactive({ notes: '' })

function onConfirm() {
  emit('confirm', { notes: state.notes || null })
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Approve Production Order"
    :ui="{ content: 'max-w-md' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <UAlert
          icon="i-lucide-check-circle"
          color="success"
          variant="soft"
          title="You are about to approve this production order."
          description="After approval, the Supervisor can release the PO to generate Work Orders."
        />
        <UFormField label="Notes (optional)">
          <UTextarea
            v-model="state.notes"
            placeholder="Add an approval note if needed..."
            :rows="3"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          label="Cancel"
          :disabled="props.loading"
          @click="emit('update:open', false)"
        />
        <UButton
          color="success"
          variant="solid"
          label="Approve"
          :loading="props.loading"
          @click="onConfirm"
        />
      </div>
    </template>
  </UModal>
</template>