<script setup lang="ts">
import { computed } from 'vue'
import HomeDateRangePicker from '../../../../components/home/HomeDateRangePicker.vue'

type DateRangeValue = {
  start?: Date
  end?: Date
}

type ActivityType = 'IN' | 'OUT'

const props = defineProps<{
  search: string
  filters: {
    activity_type?: ActivityType
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
  download: []
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

const activityItems = ['IN', 'OUT']

const categoryItems = ['Placement', 'Take Out']

const selectedActivity = computed({
  get() {
    return props.filters.activity_type || undefined
  },
  set(value: ActivityType | undefined) {
    emit('update:filters', {
      activity_type: value || undefined
    })
  }
})

const selectedCategory = computed({
  get() {
    return props.filters.wo_category || undefined
  },
  set(value: string | undefined) {
    emit('update:filters', {
      wo_category: value || undefined
    })
  }
})

const selectedWarehouseArea = computed({
  get() {
    if (props.filters.warehouse_area_id == null) return undefined

    const found = props.warehouseAreas.find(
      area => area.id === props.filters.warehouse_area_id
    )

    return found?.name
  },
  set(value: string | undefined) {
    if (!value) {
      emit('update:filters', {
        warehouse_area_id: undefined
      })

      return
    }

    const found = props.warehouseAreas.find(
      area => area.name === value
    )

    emit('update:filters', {
      warehouse_area_id: found?.id
    })
  }
})
</script>

<template>
  <UCard>
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
      <UInput
        :model-value="search"
        icon="i-lucide-search"
        placeholder="Search WO / Part / Label / Bin"
        @update:model-value="emit('update:search', String($event))"
      />

      <HomeDateRangePicker
        v-model="dateRange as any"
        clear
      />

      <USelectMenu
        v-model="selectedActivity"
        :items="activityItems"
        placeholder="Activity"
        class="w-full"
        searchable
        clear
      />

      <USelectMenu
        v-model="selectedCategory"
        :items="categoryItems"
        placeholder="WO Category"
        class="w-full"
        searchable
        clear
      />

      <USelectMenu
        v-model="selectedWarehouseArea"
        :items="warehouseAreas.map(area => area.name)"
        placeholder="Warehouse Area"
        class="w-full"
        searchable
        clear
      />
    </div>
  </UCard>
</template>