<script setup lang="ts">
import { computed } from 'vue'
import type { DropdownOption } from '../composables/useDockDropdowns'

interface Filters {
  area_id: number | undefined
}

const props = defineProps<{
  search: string
  filters: Filters
  areas: DropdownOption[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: Partial<Filters>]
}>()

const areaItems = computed(() => [
  props.areas.map(area => area.name)
])

const selectedArea = computed({
  get() {
    if (props.filters.area_id == null) return undefined

    const found = props.areas.find(
      a => a.id === props.filters.area_id
    )
    return found?.name
  },
  set(value: string | undefined) {
    if (!value) {
      updateFilter('area_id', undefined)
      return
    }

    const found = props.areas.find(
      a => a.name === value
    )

    updateFilter('area_id', found?.id)
  }
})

function updateFilter(key: keyof Filters, value: any) {
  emit('update:filters', { [key]: value })
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <USelectMenu
      v-model="selectedArea"
      :items="areaItems"
      placeholder="Filter by Area"
      class="w-full md:w-48"
      clear
    />
    
    <UInput 
      :model-value="props.search" 
      icon="i-lucide-search"
      placeholder="Search docks..."
      class="w-full md:w-64 ml-auto"
      @update:model-value="emit('update:search', $event as string)"
    />
  </div>
</template>