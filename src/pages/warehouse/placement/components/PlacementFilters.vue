<script setup lang="ts">
import { computed } from 'vue'
import HomeDateRangePicker from '../../../../components/home/HomeDateRangePicker.vue'

type DateRangeValue = {
  start?: Date
  end?: Date
}

const props = defineProps<{
  search: string
  filters: {
    warehouse_area_id?: number
    wo_status_id?: number
    wo_type_id?: number
    wo_date_start?: string
    wo_date_end?: string
  }
  warehouseAreas: { id: number, name: string }[]
  workOrderTypes: { id: number, name: string }[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
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

const woDateRange = computed<DateRangeValue>({
  get() {
    return {
      start: parseDate(props.filters.wo_date_start),
      end: parseDate(props.filters.wo_date_end)
    }
  },
  set(value) {
    emit('update:filters', {
      wo_date_start: formatDate(value?.start),
      wo_date_end: formatDate(value?.end)
    })
  }
})

const statuses = [
  { id: 2, name: 'Submitted' },
  { id: 3, name: 'In Progress' },
  { id: 4, name: 'Completed' }
]

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

const selectedWorkOrderType = computed({
  get() {
    if (props.filters.wo_type_id == null) return undefined

    const found = props.workOrderTypes.find(
      type => type.id === props.filters.wo_type_id
    )

    return found?.name
  },

  set(value: string | undefined) {
    if (!value) {
      emit('update:filters', {
        wo_type_id: undefined
      })

      return
    }

    const found = props.workOrderTypes.find(
      type => type.name === value
    )

    emit('update:filters', {
      wo_type_id: found?.id
    })
  }
})

const selectedStatus = computed({
  get() {
    if (props.filters.wo_status_id == null) return undefined

    const found = statuses.find(
      status => status.id === props.filters.wo_status_id
    )

    return found?.name
  },

  set(value: string | undefined) {
    if (!value) {
      emit('update:filters', {
        wo_status_id: undefined
      })

      return
    }

    const found = statuses.find(
      status => status.name === value
    )

    emit('update:filters', {
      wo_status_id: found?.id
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
        placeholder="Search Work Order"
        @update:model-value="emit('update:search', String($event))"
      />

        <HomeDateRangePicker
          v-model="woDateRange as any"
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

      <USelectMenu
        v-model="selectedWorkOrderType"
        :items="workOrderTypes.map(type => type.name)"
        placeholder="Work Order Type"
        class="w-full"
        searchable
        clear
      />

      <USelectMenu
        v-model="selectedStatus"
        :items="statuses.map(status => status.name)"
        placeholder="Status"
        class="w-full"
        searchable
        clear
      />
    </div>
  </UCard>
</template>