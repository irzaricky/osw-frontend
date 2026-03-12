<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarType } from '../../../../types/master-data/shift-calendar'

const props = defineProps<{
  search: string
  filters: {
    shift_id?: number
    line_id?: number
    ref_type_calendar_id?: number
    active?: boolean
  }
  shiftDropdown: { id: number; name: string; shift_number: number }[]
  lineDropdown: { id: number; name: string }[]
  calendarTypes: CalendarType[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: typeof props.filters]
}>()

const shiftItems = computed(() => [props.shiftDropdown.map(s => `${s.shift_number} – ${s.name}`)])
const lineItems = computed(() => [props.lineDropdown.map(l => l.name)])
const calendarTypeItems = computed(() => [props.calendarTypes.map(c => c.name)])
const activeItems = [['Active', 'Inactive']]

const selectedShift = computed({
  get: () => {
    const s = props.shiftDropdown.find(s => s.id === props.filters.shift_id)
    return s ? `${s.shift_number} – ${s.name}` : null
  },
  set: (v) => emit('update:filters', {
    ...props.filters,
    shift_id: v ? props.shiftDropdown.find(s => `${s.shift_number} – ${s.name}` === v)?.id : undefined,
  }),
})

const selectedLine = computed({
  get: () => props.lineDropdown.find(l => l.id === props.filters.line_id)?.name ?? null,
  set: (v) => emit('update:filters', {
    ...props.filters,
    line_id: v ? props.lineDropdown.find(l => l.name === v)?.id : undefined,
  }),
})

const selectedCalendarType = computed({
  get: () => props.calendarTypes.find(c => c.id === props.filters.ref_type_calendar_id)?.name ?? null,
  set: (v) => emit('update:filters', {
    ...props.filters,
    ref_type_calendar_id: v ? props.calendarTypes.find(c => c.name === v)?.id : undefined,
  }),
})

const selectedActive = computed({
  get: () => props.filters.active !== undefined ? (props.filters.active ? 'Active' : 'Inactive') : null,
  set: (v) => emit('update:filters', { ...props.filters, active: v != null ? v === 'Active' : undefined }),
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
      <USelectMenu v-model="selectedShift" :items="shiftItems" placeholder="Shift" class="w-44" clear />
      <USelectMenu v-model="selectedLine" :items="lineItems" placeholder="Line" class="w-36" clear />
      <USelectMenu v-model="selectedCalendarType" :items="calendarTypeItems" placeholder="Calendar Type" class="w-40" clear />
      <USelectMenu v-model="selectedActive" :items="activeItems" placeholder="Status" class="w-32" clear />
      <UInput
        :model-value="search"
        icon="i-lucide-search"
        placeholder="Search calendars..."
        class="w-64 ml-auto"
        @update:model-value="emit('update:search', $event)"
      />
  </div>
</template>