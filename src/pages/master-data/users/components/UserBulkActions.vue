<script setup lang="ts">
defineProps<{
  count: number
}>()

const emit = defineEmits<{
  delete: []
}>()
</script>

<template>
  <div 
    v-if="count > 0" 
    class="flex items-center justify-between bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg"
  >
    <span class="text-sm font-medium">
      {{ count }} user(s) selected
    </span>
    <UButton 
      icon="i-lucide-trash-2" 
      color="error" 
      variant="subtle" 
      label="Delete Selected" 
      size="sm"
      @click="emit('delete')" 
    />
  </div>
</template>
