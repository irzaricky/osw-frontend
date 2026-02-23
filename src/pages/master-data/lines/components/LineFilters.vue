<script setup lang="ts">
import { computed } from 'vue'
import type { Factory } from '../../../../types/master-data/factory'

interface Filters {
  factory_id: number | undefined
}

const props = defineProps<{
  search: string
  filters: Filters
  factories: Pick<Factory, 'id' | 'name'>[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: Partial<Filters>]
}>()

const factoryItems = computed(() => [
  props.factories.map(f => f.name)
])

const selectedFactory = computed({
  get() {
    if (props.filters.factory_id == null) return undefined
    return props.factories.find(f => f.id === props.filters.factory_id)?.name
  },
  set(value: string | undefined) {
    if (!value) {
      emit('update:filters', { factory_id: undefined })
      return
    }
    const found = props.factories.find(f => f.name === value)
    emit('update:filters', { factory_id: found?.id })
  }
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <USelectMenu
      v-model="selectedFactory"
      :items="factoryItems"
      placeholder="Filter by Factory"
      class="w-full md:w-48"
      clear
    />
    <UInput
      :model-value="props.search"
      icon="i-lucide-search"
      placeholder="Search lines..."
      class="w-full md:w-64 ml-auto"
      @update:model-value="emit('update:search', $event as string)"
    />
  </div>
</template>