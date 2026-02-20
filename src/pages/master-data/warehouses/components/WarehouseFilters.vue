<script setup lang="ts">
import { computed } from 'vue'
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

const categoryItems = computed(() => [
  props.warehouseCategories.map(cat => cat.name)
])

const lineItems = computed(() => [
  props.lines.map(line => line.name)
])

const selectedCategory = computed({
  get() {
    if (props.filters.category_id == null) return undefined

    const found = props.warehouseCategories.find(
      c => c.id === props.filters.category_id
    )
    return found?.name
  },
  set(value: string | undefined) {
    if (!value) {
      updateFilter('category_id', undefined)
      return
    }

    const found = props.warehouseCategories.find(
      c => c.name === value
    )

    updateFilter('category_id', found?.id)
  }
})

const selectedLine = computed({
  get() {
    if (props.filters.line_id == null) return undefined

    const found = props.lines.find(
      l => l.id === props.filters.line_id
    )
    return found?.name
  },
  set(value: string | undefined) {
    if (!value) {
      updateFilter('line_id', undefined)
      return
    }

    const found = props.lines.find(
      l => l.name === value
    )

    updateFilter('line_id', found?.id)
  }
})

function updateFilter(key: keyof Filters, value: any) {
  emit('update:filters', { [key]: value })
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <USelectMenu
      v-model="selectedCategory"
      :items="categoryItems"
      placeholder="Filter by Category"
      class="w-full md:w-48"
      clear
    />
    <USelectMenu
      v-model="selectedLine"
      :items="lineItems"
      placeholder="Filter by Line"
      class="w-full md:w-48"
      clear
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