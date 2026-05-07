<script setup lang="ts">
import { computed } from 'vue'
import type { WorkOrderStoringStatus, WorkOrderStoringCategory } from '../../../../types/warehouse/work-order-storing'
import type { Range } from '../../../../types'
import HomeDateRangePicker from '../../../../components/home/HomeDateRangePicker.vue'

interface Filters {
  wo_category: WorkOrderStoringCategory | undefined
  wo_status_id: number | undefined
  date_range: Range | undefined
}

const props = defineProps<{
  search: string
  filters: Filters
  categories: WorkOrderStoringCategory[]
  statuses: Pick<WorkOrderStoringStatus, 'id' | 'name'>[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: Partial<Filters>]
}>()

const statusItems = computed(() => [
  props.statuses.map(s => s.name)
])

const categoryItems = computed(() => [
  props.categories
])

const selectedStatus = computed({
  get() {
    if (props.filters.wo_status_id == null) return undefined

    const found = props.statuses.find(
      c => c.id === props.filters.wo_status_id
    )
    return found?.name
  },
  set(value: string | undefined) {
    if (!value) {
      updateFilter('wo_status_id', undefined)
      return
    }

    const found = props.statuses.find(
      c => c.name === value
    )

    updateFilter('wo_status_id', found?.id)
  }
})

const selectedCategory = computed({
  get() {
    return props.filters.wo_category || undefined
  },
  set(value: WorkOrderStoringCategory | undefined) {
    updateFilter('wo_category', value)
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
      v-model="selectedCategory"
      :items="categoryItems"
      placeholder="Filter by Category"
      class="w-full md:w-48"
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
      placeholder="Search work order..."
      class="w-full md:w-64 ml-auto"
      @update:model-value="emit('update:search', $event as string)"
    />
  </div>
</template>