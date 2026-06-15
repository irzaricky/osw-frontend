<script setup lang="ts">
defineProps<{
  search: string
  filters: {
    station_id?: number
    status?: string
  }
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: Record<string, any>]
  reset: []
}>()

const statusItems = [
  'Safe',
  'Need Replenishment',
  'Empty'
]
</script>

<template>
  <UCard>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <UInput
        :model-value="search"
        icon="i-lucide-search"
        placeholder="Search station or material..."
        @update:model-value="emit('update:search', String($event))"
      />
      <USelectMenu
        :model-value="filters.status"
        :items="statusItems"
        placeholder="Select status"
        clear
        class="w-full"
        @update:model-value="emit('update:filters', { status: $event || undefined })"
      />
    </div>
  </UCard>
</template>