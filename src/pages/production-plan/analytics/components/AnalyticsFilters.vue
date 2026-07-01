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
    line_id?: number
    shift_id?: number
    status?: string
  }
  lines: { id: number, name: string }[]
  shifts: { id: number, name: string }[]
}>()

const emit = defineEmits<{
  'update:filters': [value: Record<string, any>]
}>()

const statusOptions = [
  'Released',
  'In Progress',
  'Completed',
  'Closed'
]

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

const selectedLine = computed({
  get() {
    if (props.filters.line_id == null) return undefined

    return props.lines.find(line => line.id === props.filters.line_id)?.name
  },
  set(value: string | undefined) {
    emit('update:filters', {
      line_id: value
        ? props.lines.find(line => line.name === value)?.id
        : undefined
    })
  }
})

const selectedShift = computed({
  get() {
    if (props.filters.shift_id == null) return undefined

    return props.shifts.find(shift => shift.id === props.filters.shift_id)?.name
  },
  set(value: string | undefined) {
    emit('update:filters', {
      shift_id: value
        ? props.shifts.find(shift => shift.name === value)?.id
        : undefined
    })
  }
})

const selectedStatus = computed({
  get() {
    return props.filters.status
  },
  set(value: string | undefined) {
    emit('update:filters', { status: value })
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
        v-model="selectedLine"
        placeholder="Production Line"
        :items="lines.map(line => line.name)"
        class="w-full"
        searchable
        clear
      />

      <USelectMenu
        v-model="selectedShift"
        placeholder="Shift"
        :items="shifts.map(shift => shift.name)"
        class="w-full"
        searchable
        clear
      />

      <USelectMenu
        v-model="selectedStatus"
        placeholder="Work Order Status"
        :items="statusOptions"
        class="w-full"
        clear
      />
    </div>
  </UCard>
</template>
