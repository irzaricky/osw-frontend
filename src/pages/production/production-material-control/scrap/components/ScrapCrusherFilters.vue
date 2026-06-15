<script setup lang="ts">
import type { Range } from '../../../../../types'


defineProps<{
  search: string
  dateRange?: Range
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:dateRange': [value: Range | undefined]
  reset: []
}>()
</script>

<template>
  <UCard>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <UInput :model-value="search" icon="i-lucide-search" placeholder="Search product, material..."
        @update:model-value="emit('update:search', String($event))" />
    </div>
  </UCard>
</template>