<script setup lang="ts">

import { CalendarDate } from '@internationalized/date'

defineProps<{
  search: string
  filters: {
    warehouse_area_id?: number
    wo_status_id?: number
    wo_type_id?: number
    wo_date?: string
  }
  warehouseAreas: { id: number, name: string }[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: Record<string, any>]
  reset: []
}>()

function parseCalendarDate(value?: string) {
  if (!value) return undefined

  const [year, month, day] = value.split('-').map(Number)
  return new CalendarDate(year, month, day)
}

function formatCalendarDate(value: any) {
  if (!value) return undefined

  return `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`
}
</script>

<template>
  <UCard>
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <UInput :model-value="search" icon="i-lucide-search" placeholder="Search Work Order"
        @update:model-value="emit('update:search', String($event))" />

      <UPopover>
        <UButton color="neutral" variant="outline" icon="i-lucide-calendar"
          :label="filters.wo_date || 'WO Date'" />

        <template #content>
          <div class="p-2">
            <UCalendar :model-value="parseCalendarDate(filters.wo_date)" @update:model-value="(value) => {
              emit('update:filters', { wo_date: formatCalendarDate(value) })
            }" />
          </div>
        </template>
      </UPopover>

      <USelect :model-value="filters.warehouse_area_id" placeholder="Warehouse Area" :items="warehouseAreas.map(area => ({
        label: area.name,
        value: area.id
      }))" @update:model-value="emit('update:filters', { warehouse_area_id: $event ? Number($event) : undefined })" />

      <USelect :model-value="filters.wo_status_id" placeholder="Status" :items="[
        { label: 'Submitted', value: 2 },
        { label: 'In Progress', value: 3 },
        { label: 'Completed', value: 4 }
      ]" @update:model-value="emit('update:filters', { wo_status_id: $event ? Number($event) : undefined })" />

      <UButton icon="i-lucide-rotate-ccw" variant="soft" color="neutral" label="Reset" @click="emit('reset')" />
    </div>
  </UCard>
</template>