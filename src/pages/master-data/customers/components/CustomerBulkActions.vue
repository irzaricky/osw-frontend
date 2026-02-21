<script setup lang="ts">
defineProps<{
  count: number
}>()

defineEmits<{
  (e: 'delete'): void
}>()
</script>

<template>
  <div v-if="count > 0" class="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
    <div class="flex items-center gap-2 text-primary">
      <UIcon name="i-lucide-check-square" class="w-5 h-5" />
      <span class="font-medium">{{ count }} items selected</span>
    </div>
    <div class="flex gap-2">
      <UButton
        icon="i-lucide-trash-2"
        color="error"
        variant="soft"
        label="Delete Selected"
        @click="$emit('delete')"
      />
    </div>
  </div>
</template>
