<script setup lang="ts">
interface WfModal {
  open:          boolean
  title:         string
  description:   string
  inputLabel:    string
  inputValue:    string
  inputRequired: boolean
  actionLoading: boolean
  action:        (() => Promise<void>) | null
}

const props = defineProps<{ modal: WfModal }>()
const emit  = defineEmits<{
  'update:modal': [v: WfModal]
  close: []
}>()

function setInputValue(v: string) {
  emit('update:modal', { ...props.modal, inputValue: v })
}
</script>

<template>
  <UModal v-model:open="modal.open" :title="modal.title">
    <template #body>
      <p class="text-sm text-muted">
        {{ modal.description }}
      </p>
      <UFormField v-if="modal.inputLabel" :label="modal.inputLabel" class="mt-4">
        <UTextarea
          :model-value="modal.inputValue"
          :placeholder="modal.inputRequired ? 'Required...' : 'Optional...'"
          class="w-full"
          :rows="3"
          @update:model-value="setInputValue"
        />
      </UFormField>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          :disabled="modal.actionLoading"
          @click="emit('close')"
        />
        <UButton
          label="Confirm"
          color="primary"
          :loading="modal.actionLoading"
          :disabled="modal.inputRequired && !modal.inputValue.trim()"
          @click="modal.action?.()"
        />
      </div>
    </template>
  </UModal>
</template>