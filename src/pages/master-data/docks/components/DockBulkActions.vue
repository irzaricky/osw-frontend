<script setup lang="ts">
const props = defineProps<{
  count: number
}>()

const emit = defineEmits<{
  delete: []
}>()
</script>

<template>
  <div v-if="props.count > 0" class="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 rounded-lg">
    <span class="text-sm font-medium text-primary-900 dark:text-primary-100">
      {{ props.count }} dock(s) selected
    </span>
    <UButton 
      icon="i-lucide-trash-2" 
      color="error" 
      variant="ghost" 
      size="sm"
      label="Delete Selected" 
      @click="emit('delete')" 
    />
  </div>
</template>