<script setup lang="ts">
import type { DropdownOption } from '../composables/useUserDropdowns'

interface Filters {
  role_id: number | undefined
  division_id: number | undefined
  factory_id: number | undefined
  line_id: number | undefined
  active: string | undefined
}

const props = defineProps<{
  search: string
  filters: Filters
  roles: DropdownOption[]
  divisions: DropdownOption[]
  factories: DropdownOption[]
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
      :model-value="props.filters.role_id"
      :items="[{ label: 'All Roles', value: undefined }, ...roles.map((r: DropdownOption) => ({ label: r.name, value: r.id }))]"
      placeholder="Filter by Role" 
      class="w-full md:w-40"
      @update:model-value="updateFilter('role_id', $event)"
    />
    <USelect 
      :model-value="props.filters.division_id"
      :items="[{ label: 'All Divisions', value: undefined }, ...divisions.map((d: DropdownOption) => ({ label: d.name, value: d.id }))]" 
      placeholder="Filter by Division" 
      class="w-full md:w-44"
      @update:model-value="updateFilter('division_id', $event)"
    />
    <USelect 
      :model-value="props.filters.factory_id"
      :items="[{ label: 'All Factory', value: undefined }, { label: 'None', value: 0 }, ...factories.map((f: DropdownOption) => ({ label: f.name, value: f.id }))]" 
      placeholder="Filter by Factory" 
      class="w-full md:w-40"
      @update:model-value="updateFilter('factory_id', $event)"
    />
    <USelect 
      :model-value="props.filters.line_id"
      :items="[{ label: 'All Lines', value: undefined }, ...lines.map((l: DropdownOption) => ({ label: l.name, value: l.id }))]" 
      placeholder="Filter by Line" 
      class="w-full md:w-40"
      :disabled="!props.filters.factory_id"
      @update:model-value="updateFilter('line_id', $event)"
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
      placeholder="Search users..." 
      class="w-full md:w-64 ml-auto"
      @update:model-value="emit('update:search', $event as string)"
    />
  </div>
</template>
