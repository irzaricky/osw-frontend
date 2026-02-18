<script setup lang="ts">
import type { DropdownOption } from '../composables/useVehicleDropdowns'

interface Filters {
  vehicle_type_id: number | undefined
  active: string | undefined
}

const props = defineProps<{
  search: string
  filters: Filters
  vehicleTypes: DropdownOption[]
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
      :model-value="props.filters.vehicle_type_id"
      :items="[{ label: 'All Types', value: undefined }, ...vehicleTypes.map((vt: DropdownOption) => ({ label: vt.name, value: vt.id }))]"
      placeholder="Filter by Vehicle Type" 
      class="w-full md:w-48"
      @update:model-value="updateFilter('vehicle_type_id', $event)"
    />
    <USelect 
      :model-value="props.filters.active"
      :items="[
        { label: 'All Status', value: 'all' },
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' }
      ]" 
      placeholder="Filter by Status" 
      class="w-full md:w-40"
      @update:model-value="updateFilter('active', $event)"
    />
    
    <UInput 
      :model-value="props.search"
      icon="i-lucide-search" 
      placeholder="Search vehicles..." 
      class="w-full md:w-64 ml-auto"
      @update:model-value="emit('update:search', $event as string)"
    />
  </div>
</template>
