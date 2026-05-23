<script setup lang="ts">
defineProps<{
  open:        boolean
  description: string
}>()

const emit = defineEmits<{
  'update:open': [v: boolean]
  confirm: []
}>()
</script>

<template>
  <UModal :open="open" title="Remove Component" @update:open="emit('update:open', $event)">
    <template #body>
      <p class="text-sm text-muted">
        {{ description }}
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          @click="emit('update:open', false)"
        />
        <UButton label="Remove" color="error" @click="emit('confirm')" />
      </div>
    </template>
  </UModal>
</template>