<script setup lang="ts">
const props = defineProps<{
  search: string
}>()

const emit = defineEmits<{
  'update:search': [value: string]
}>()
</script>

<template>
  <UCard>
    <div class="flex flex-wrap items-center gap-3">
      <UInput
        :model-value="props.search"
        icon="i-lucide-search"
        placeholder="Search Warehouse"
        class="w-full md:w-64 ml-auto"
        @update:model-value="emit('update:search', $event as string)"
      />
    </div>
  </UCard>
</template>