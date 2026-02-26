<script setup lang="ts">
import { computed } from 'vue'
import type { DefectCategory } from '../../../../types/master-data/defect'

interface Filters {
  defect_category_id: number | undefined
}

const props = defineProps<{
  search: string
  filters: Filters
  defectCategories: Pick<DefectCategory, 'id' | 'name'>[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: Partial<Filters>]
}>()

const categoryItems = computed(() => [
  props.defectCategories.map(def => def.name)
])

const selectedCategory = computed({
  get() {
    if (props.filters.defect_category_id == null) return undefined

    const found = props.defectCategories.find(
      c => c.id === props.filters.defect_category_id
    )
    return found?.name
  },
  set(value: string | undefined) {
    if (!value) {
      updateFilter('defect_category_id', undefined)
      return
    }

    const found = props.defectCategories.find(
      c => c.name === value
    )

    updateFilter('defect_category_id', found?.id)
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

    <UInput
      :model-value="props.search"
      icon="i-lucide-search"
      placeholder="Search defects..."
      class="w-full md:w-64 ml-auto"
      @update:model-value="emit('update:search', $event as string)"
    />
  </div>
</template>