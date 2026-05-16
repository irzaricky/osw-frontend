<script setup lang="ts">
import { computed } from 'vue'
import type { MaterialReceivingStatus } from '../../../../types/warehouse/material-receiving'
import type { Range } from '../../../../types'
import HomeDateRangePicker from '../../../../components/home/HomeDateRangePicker.vue'

interface Filters {
  status: any
  date_range: Range | undefined
}

const props = defineProps<{
  search: string
  filters: Filters
  statuses: Pick<MaterialReceivingStatus, 'id' | 'name'>[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: Partial<Filters>]
}>()

const statusItems = computed(() =>
  props.statuses.map(s => s.name)
)

const selectedStatus = computed({
  get() {
    return props.filters.status?.name
  },

  set(value: string | undefined) {
    if (!value) {
      updateFilter('status', undefined)
      return
    }

    const found = props.statuses.find(
      c => c.name === value
    )

    updateFilter('status', found)
  }
})

const selectedDateRange = computed({
  get() {
    return props.filters.date_range
  },
  set(value: Range | undefined) {
    updateFilter('date_range', value)
  }
})

function updateFilter(key: keyof Filters, value: any) {
  emit('update:filters', { [key]: value })
}
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
      :items="statusItems"
      placeholder="Filter by Status"
      class="w-full md:w-48"
      clear
    />

    <UInput
      :model-value="props.search"
      icon="i-lucide-search"
      placeholder="Search MDO Number"
      class="w-full md:w-64 ml-auto"
      @update:model-value="emit('update:search', $event as string)"
    />
  </div>
</template>