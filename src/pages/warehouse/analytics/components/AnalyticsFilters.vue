<script setup lang="ts">
import { computed } from 'vue'
import HomeDateRangePicker from '../../../../components/home/HomeDateRangePicker.vue'

type DateRangeValue = {
  start?: Date
  end?: Date
}

const props = defineProps<{
  filters: {
    date_from?: string
    date_to?: string
    warehouse_area_id?: number
    part_category?: string
    movement_type?: string
    part_number?: string
  }
  warehouseAreas: { id: number, name: string }[]
}>()

const emit = defineEmits<{
  'update:filters': [value: Record<string, any>]
}>()

function formatDate(date?: Date) {
  if (!date) return undefined

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function parseDate(value?: string) {
  if (!value) return undefined

  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const dateRange = computed<DateRangeValue>({
  get() {
    return {
      start: parseDate(props.filters.date_from),
      end: parseDate(props.filters.date_to)
    }
  },
  set(value) {
    emit('update:filters', {
      date_from: formatDate(value?.start),
      date_to: formatDate(value?.end)
    })
  }
})

const selectedWarehouseArea = computed({
  get() {
    if (props.filters.warehouse_area_id == null) return undefined

    return props.warehouseAreas.find(
      area => area.id === props.filters.warehouse_area_id
    )?.name
  },
  set(value: string | undefined) {
    emit('update:filters', {
      warehouse_area_id: value
        ? props.warehouseAreas.find(area => area.name === value)?.id
        : undefined
    })
  }
})
</script>

<template>
  <UCard>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
      <HomeDateRangePicker
        v-model="dateRange as any"
        clear
      />

      <USelectMenu
        v-model="selectedWarehouseArea"
        placeholder="Warehouse Area"
        :items="warehouseAreas.map(area => area.name)"
        class="w-full"
        searchable
        clear
      />
    </div>
  </UCard>
</template>