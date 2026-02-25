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
    @update:open="emit('update:open', $event)"
  >
    <!-- HEADER -->
    <template #header>
      <div class="w-full text-center space-y-2 py-2">
        <h3 class="text-lg font-semibold">
          {{ props.title || 'Confirm Action' }}
        </h3>

        <p class="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          {{ props.description || 'Are you sure you want to proceed?' }}
        </p>
      </div>
    </template>

    <!-- FOOTER -->
    <template #footer>
      <div class="flex justify-center gap-3 w-full pt-2">
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