<script setup lang="ts">
import { computed } from 'vue'
import type { Line } from '../../../../types/master-data/line'
import type { StationType } from '../../../../types/master-data/station'

interface Filters {
  line_id: number | undefined
  station_type_id: number | undefined
  status: boolean | undefined
}

const props = defineProps<{
  search: string
  filters: Filters
  lines: Pick<Line, 'id' | 'name'>[]
  stationTypes: StationType[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: Partial<Filters>]
}>()

const lineItems = computed(() => [props.lines.map(l => l.name)])
const typeItems = computed(() => [props.stationTypes.map(t => t.name)])
const statusItems = [['Active', 'Inactive']]

const selectedLine = computed({
  get: () => props.lines.find(l => l.id === props.filters.line_id)?.name,
  set: (v) => emit('update:filters', { line_id: v ? props.lines.find(l => l.name === v)?.id : undefined }),
})

const selectedType = computed({
  get: () => props.stationTypes.find(t => t.id === props.filters.station_type_id)?.name,
  set: (v) => emit('update:filters', { station_type_id: v ? props.stationTypes.find(t => t.name === v)?.id : undefined }),
})

const selectedStatus = computed({
  get: () => props.filters.status === undefined ? undefined : props.filters.status ? 'Active' : 'Inactive',
  set: (v) => emit('update:filters', { status: v != null ? v === 'Active' : undefined }),
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <USelectMenu v-model="selectedLine" :items="lineItems" placeholder="Filter by Line" class="w-44" clear />
    <USelectMenu v-model="selectedType" :items="typeItems" placeholder="Filter by Type" class="w-44" clear />
    <USelectMenu v-model="selectedStatus" :items="statusItems" placeholder="Filter by Status" class="w-44" clear />
    <UInput
      :model-value="search"
      icon="i-lucide-search"
      placeholder="Search stations..."
      class="w-64 ml-auto"
      @update:model-value="emit('update:search', $event as string)"
    />
  </div>
</template>