<script setup lang="ts">
import { computed }            from 'vue'
import HomeDateRangePicker     from '../../../../components/home/HomeDateRangePicker.vue'
import type { Range }          from '../../../../types'
import type { WorkOrderStatus } from '../../../../types/production-plan/work-order'

interface Filters {
  status?:    WorkOrderStatus | undefined
  date_range?: Range | undefined
  line_id?:   number | undefined
  shift_id?:  number | undefined
}

const props = defineProps<{
  search:  string
  filters: Filters
}>()

const emit = defineEmits<{
  'update:search':  [value: string]
  'update:filters': [value: Partial<Filters>]
  'reset':          []
}>()

const STATUS_OPTIONS: { label: string; value: WorkOrderStatus }[] = [
  { label: 'Released',    value: 'Released' },
  { label: 'In Progress', value: 'In_Progress' },
  { label: 'Completed',   value: 'Completed' },
  { label: 'Cancelled',   value: 'Cancelled' },
]

const selectedDateRange = computed({
  get() { return props.filters.date_range },
  set(value: Range | undefined) { emit('update:filters', { date_range: value }) },
})

const selectedStatus = computed({
  get() { return props.filters.status },
  set(value: WorkOrderStatus | undefined) { emit('update:filters', { status: value ?? undefined }) },
})

const hasActiveFilters = computed(() =>
  !!props.filters.status    ||
  !!props.filters.date_range ||
  !!props.filters.line_id   ||
  !!props.filters.shift_id  ||
  !!props.search,
)
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">

    <HomeDateRangePicker
      v-model="selectedDateRange"
      class="w-full md:w-70"
      clear
    />

    <USelectMenu
      v-model="selectedStatus"
      :items="STATUS_OPTIONS"
      value-key="value"
      label-key="label"
      placeholder="Filter by Status"
      class="w-full md:w-44"
      clear
    />

    <UInput
      :model-value="search"
      icon="i-lucide-search"
      placeholder="Search WO number..."
      class="w-full md:w-64 ml-auto"
      @update:model-value="emit('update:search', $event as string)"
    />
  </div>
</template>