<script setup lang="ts">
import { ref, watch, useTemplateRef } from 'vue'
import { CalendarDate } from '@internationalized/date'
import type { DropdownOption, UserDropdownOption } from '../composables/useLogDropdowns'

interface Filters {
  start_date: string | undefined
  end_date: string | undefined
  module_id: number | undefined
  activity_id: number | undefined
  user_id: number | undefined
}

const props = defineProps<{
  search: string
  filters: Filters
  modules: DropdownOption[]
  activities: DropdownOption[]
  users: UserDropdownOption[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: Partial<Filters>]
}>()

// Date Picker State
const inputDate = useTemplateRef('inputDate')
const dateRange = ref<any>({
  start: props.filters.start_date ? new CalendarDate(...props.filters.start_date.split('-').map(Number) as [number, number, number]) : undefined,
  end: props.filters.end_date ? new CalendarDate(...props.filters.end_date.split('-').map(Number) as [number, number, number]) : undefined
})

// Sync internal DateRange with parent Props (in case of external reset)
watch(() => [props.filters.start_date, props.filters.end_date], ([newStart, newEnd]) => {
  if (!newStart && !newEnd) {
    dateRange.value = { start: undefined, end: undefined }
  } 
  // We generally trust the internal state, but if parent clears it, we clear internal.
})

// Sync internal DateRange to parent Filters
watch(dateRange, (newRange) => {
  if (newRange?.start && newRange?.end) {
    emit('update:filters', {
      start_date: newRange.start.toString(),
      end_date: newRange.end.toString()
    })
  } else if (!newRange?.start && !newRange?.end) {
    emit('update:filters', {
      start_date: undefined,
      end_date: undefined
    })
  }
})

function updateFilter(key: keyof Filters, value: any) {
  emit('update:filters', { [key]: value })
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <!-- Date Range Picker -->
    <UInputDate ref="inputDate" v-model="dateRange" range>
      <template #trailing>
        <UPopover :reference="inputDate?.inputsRef?.[0]?.$el">
          <UButton
            color="neutral"
            variant="link"
            size="sm"
            icon="i-lucide-calendar"
            aria-label="Select a date range"
            class="px-0"
          />

          <template #content>
             <UCalendar v-model="dateRange" class="p-2" :number-of-months="2" range />
          </template>
        </UPopover>
      </template>
    </UInputDate>

    <!-- Module Filter -->
    <USelect 
      :model-value="props.filters.module_id"
      :items="[{ label: 'All Modules', value: undefined }, ...modules.map((m: DropdownOption) => ({ label: m.name, value: m.id }))]"
      placeholder="Filter by Module" 
      class="w-full md:w-40"
      @update:model-value="updateFilter('module_id', $event)"
    />

    <!-- Activity Filter -->
    <USelect 
      :model-value="props.filters.activity_id"
      :items="[{ label: 'All Activities', value: undefined }, ...activities.map((a: DropdownOption) => ({ label: a.name, value: a.id }))]" 
      placeholder="Filter by Activity" 
      class="w-full md:w-40"
      @update:model-value="updateFilter('activity_id', $event)"
    />

    <!-- User Filter -->
    <USelect 
      :model-value="props.filters.user_id"
      :items="[{ label: 'All Users', value: undefined }, ...users.map((u: UserDropdownOption) => ({ label: u.email, value: u.id }))]" 
      placeholder="Filter by User" 
      class="w-full md:w-40"
      @update:model-value="updateFilter('user_id', $event)"
    />
    
    <!-- Search -->
    <UInput 
      :model-value="props.search"
      icon="i-lucide-search" 
      placeholder="Search description..." 
      class="w-full md:w-64 ml-auto"
      @update:model-value="emit('update:search', $event as string)"
    />
  </div>
</template>
