<script setup lang="ts">
const props = defineProps<{
  open: boolean
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
  emit('update:open', false)
}
</script>

<template>
  <UModal 
    :open="props.open"
    :title="props.title || 'Confirm Action'"
    :description="props.description || 'Are you sure you want to proceed?'"
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <div class="text-center">
        <h3 class="text-lg font-semibold">{{ props.title || 'Confirm Action' }}</h3>
        <p class="text-sm text-muted mt-1">{{ props.description || 'Are you sure you want to proceed?' }}</p>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2 justify-center w-full">
        <UButton 
          :label="props.cancelLabel || 'Cancel'" 
          color="neutral" 
          variant="ghost" 
          @click="handleCancel" 
        />
        <UButton 
          :label="props.confirmLabel || 'Confirm'" 
          color="error" 
          :loading="props.loading"
          @click="handleConfirm" 
        />
      </div>
    </template>
  </UModal>
</template>
