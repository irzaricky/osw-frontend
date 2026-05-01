<script setup lang="ts">
defineProps<{
  search: string
  filters: {
    activity_type?: 'IN' | 'OUT'
    wo_category?: string
    warehouse_area_id?: number
    date_from?: string
    date_to?: string
  }
  warehouseAreas: { id: number, name: string }[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: Record<string, any>]
  reset: []
}>()
</script>

<template>
  <UCard>
    <div class="grid grid-cols-1 md:grid-cols-7 gap-5">
      <UInput
        :model-value="search"
        icon="i-lucide-search"
        placeholder="Search WO / Part / Label / Bin"
        @update:model-value="emit('update:search', String($event))"
      />

      <USelect
        :model-value="filters.activity_type"
        placeholder="Activity"
        :items="[
          { label: 'IN', value: 'IN' },
          { label: 'OUT', value: 'OUT' }
        ]"
        @update:model-value="emit('update:filters', { activity_type: $event || undefined })"
      />

      <USelect
        :model-value="filters.wo_category"
        placeholder="WO Category"
        :items="[
          { label: 'Placement', value: 'Placement' },
          { label: 'Take Out', value: 'Take Out' }
        ]"
        @update:model-value="emit('update:filters', { wo_category: $event || undefined })"
      />

      <USelect
        :model-value="filters.warehouse_area_id"
        placeholder="Warehouse Area"
        :items="warehouseAreas.map(area => ({
          label: area.name,
          value: area.id
        }))"
        @update:model-value="emit('update:filters', { warehouse_area_id: $event ? Number($event) : undefined })"
      />

      <UInput
        :model-value="filters.date_from"
        type="date"
        placeholder="Date From"
        @update:model-value="emit('update:filters', { date_from: $event || undefined })"
      />

      <UInput
        :model-value="filters.date_to"
        type="date"
        placeholder="Date To"
        @update:model-value="emit('update:filters', { date_to: $event || undefined })"
      />

      <UButton
        icon="i-lucide-rotate-ccw"
        variant="soft"
        color="neutral"
        label="Reset"
        @click="emit('reset')"
      />
    </div>
  </UCard>
</template>