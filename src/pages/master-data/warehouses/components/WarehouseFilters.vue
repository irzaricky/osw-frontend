<script setup lang="ts">
import type { DropdownOption } from '../composables/useWarehouseDropdowns'

interface Filters {
  category_id: number | undefined
  line_id: number | undefined
}

const props = defineProps<{
  search: string
  filters: Filters
  warehouseCategories: DropdownOption[]
  lines: DropdownOption[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: Partial<Filters>]
}>()

function updateFilter(key: keyof Filters, value: any) {
  emit('update:filters', { [key]: value })
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <USelect
      :model-value="props.filters.category_id"
      :items="[
        { label: 'All Categories', value: undefined },
        ...warehouseCategories.map((cat: DropdownOption) => ({
          label: cat.name,
          value: cat.id
        }))
      ]"
      placeholder="Filter by Category"
      class="w-full md:w-48"
      @update:model-value="updateFilter('category_id', $event)"
    />
    <USelect
      :model-value="props.filters.line_id"
      :items="[
        { label: 'All Lines', value: undefined },
        ...lines.map((line: DropdownOption) => ({
          label: line.name,
          value: line.id
        }))
      ]"
      placeholder="Filter by Line"
      class="w-full md:w-48"
      @update:model-value="updateFilter('line_id', $event)"
    />

    <UInput
      :model-value="props.search"
      icon="i-lucide-search"
      placeholder="Search warehouses..."
      class="w-full md:w-64 ml-auto"
      @update:model-value="emit('update:search', $event as string)"
    />
  </div>
</template>