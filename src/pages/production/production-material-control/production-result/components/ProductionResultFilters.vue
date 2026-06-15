<script setup lang="ts">
defineProps<{
  search: string
  filters: {
    date_from?: string
    date_to?: string
    station_id?: number
  }
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: Record<string, any>]
  reset: []
}>()
</script>

<template>
  <UCard>
    <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
      <UInput
        :model-value="search"
        icon="i-lucide-search"
        placeholder="Search product, material, station..."
        @update:model-value="emit('update:search', String($event))"
      />
    </div>
  </UCard>
</template>