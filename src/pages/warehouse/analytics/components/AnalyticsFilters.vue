<script setup lang="ts">
defineProps<{
  filters: {
    date_from: string
    date_to: string
    warehouse_area_id?: number
    part_category?: string
    movement_type?: string
    part_number: string
  }
  warehouseAreas: { id: number, name: string }[]
}>()

const emit = defineEmits<{
  apply: []
  reset: []
}>()

const categoryItems = [
  { label: 'Small Part', value: 'Small Part' },
  { label: 'Big Part', value: 'Big Part' }
]

const movementItems = [
  { label: 'Placement', value: 'IN' },
  { label: 'Take Out', value: 'OUT' }
]
</script>

<template>
  <UCard>
    <div class="grid grid-cols-1 md:grid-cols-6 gap-3">
      <UInput
        v-model="filters.date_from"
        type="date"
        placeholder="Date From"
      />

      <UInput
        v-model="filters.date_to"
        type="date"
        placeholder="Date To"
      />

      <USelect
        v-model="filters.warehouse_area_id"
        placeholder="Warehouse Area"
        :items="warehouseAreas.map(area => ({
          label: area.name,
          value: area.id
        }))"
      />

      <USelect
        v-model="filters.part_category"
        placeholder="Part Category"
        :items="categoryItems"
      />

      <USelect
        v-model="filters.movement_type"
        placeholder="Movement Type"
        :items="movementItems"
      />

      <div class="flex gap-2">
        <UButton
          block
          icon="i-lucide-search"
          label="Apply"
          @click="emit('apply')"
        />

        <UButton
          icon="i-lucide-rotate-ccw"
          variant="soft"
          color="neutral"
          @click="emit('reset')"
        />
      </div>
    </div>
  </UCard>
</template>