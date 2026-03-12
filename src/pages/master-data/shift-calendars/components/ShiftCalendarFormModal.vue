<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ShiftCalendar, CalendarType } from '../../../../types/master-data/shift-calendar'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  shiftCalendar: Partial<ShiftCalendar>
  shiftDropdown: { id: number; name: string; shift_number: number }[]
  lineDropdown: { id: number; name: string }[]
  calendarTypes: CalendarType[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [data: Partial<ShiftCalendar>]
}>()

const shift_id = ref<number | undefined>(undefined)
const line_id = ref<number | undefined>(undefined)
const ref_type_calendar_id = ref<number | undefined>(undefined)
const start_date = ref('')
const end_date = ref('')
const date_event = ref('')
const active = ref(true)

watch(() => props.shiftCalendar, (val) => {
  shift_id.value = val.shift_id ?? undefined
  line_id.value = val.line_id ?? undefined
  ref_type_calendar_id.value = val.ref_type_calendar_id ?? undefined
  start_date.value = val.start_date ?? ''
  end_date.value = val.end_date ?? ''
  date_event.value = val.date_event ?? ''
  active.value = val.active ?? true
}, { immediate: true, deep: true })

const shiftItems = computed(() => [props.shiftDropdown.map(s => `${s.shift_number} – ${s.name}`)])
const lineItems = computed(() => [props.lineDropdown.map(l => l.name)])
const calendarTypeItems = computed(() => [props.calendarTypes.map(c => c.name)])

const selectedShift = computed({
  get: () => {
    const s = props.shiftDropdown.find(s => s.id === shift_id.value)
    return s ? `${s.shift_number} – ${s.name}` : undefined
  },
  set: (v) => { shift_id.value = v ? props.shiftDropdown.find(s => `${s.shift_number} – ${s.name}` === v)?.id : undefined },
})

const selectedLine = computed({
  get: () => props.lineDropdown.find(l => l.id === line_id.value)?.name,
  set: (v) => { line_id.value = v ? props.lineDropdown.find(l => l.name === v)?.id : undefined },
})

const selectedCalendarType = computed({
  get: () => props.calendarTypes.find(c => c.id === ref_type_calendar_id.value)?.name,
  set: (v) => { ref_type_calendar_id.value = v ? props.calendarTypes.find(c => c.name === v)?.id : undefined },
})

function handleSave() {
  emit('save', {
    shift_id: shift_id.value,
    line_id: line_id.value,
    ref_type_calendar_id: ref_type_calendar_id.value,
    start_date: start_date.value,
    end_date: end_date.value,
    date_event: date_event.value,
    active: active.value,
  })
}
</script>

<template>
  <UModal
    :open="open"
    :title="mode === 'add' ? 'Add Shift Calendar' : 'Edit Shift Calendar'"
    :ui="{ content: 'sm:max-w-xl' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form id="shift-calendar-form" class="space-y-4" @submit.prevent="handleSave">
        <UFormField label="Shift" required>
          <USelectMenu v-model="selectedShift" :items="shiftItems" placeholder="Select shift" class="w-full" clear :disabled="loading" />
        </UFormField>

        <UFormField label="Line" required>
          <USelectMenu v-model="selectedLine" :items="lineItems" placeholder="Select line" class="w-full" clear :disabled="loading" />
        </UFormField>

        <UFormField label="Calendar Type" required>
          <USelectMenu v-model="selectedCalendarType" :items="calendarTypeItems" placeholder="Select calendar type" class="w-full" clear :disabled="loading" />
        </UFormField>

        <UFormField label="Event Name" required>
          <UInput v-model="date_event" placeholder="e.g. Normal Production" class="w-full" :disabled="loading" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Start Date" required>
            <UInput v-model="start_date" type="date" class="w-full" :disabled="loading" />
          </UFormField>
          <UFormField label="End Date" required>
            <UInput v-model="end_date" type="date" class="w-full" :disabled="loading" />
          </UFormField>
        </div>

        <UFormField label="Status">
          <UCheckbox v-model="active" label="Active" :disabled="loading" />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <UButton label="Cancel" color="neutral" variant="ghost" :disabled="loading" @click="emit('update:open', false)" />
        <UButton type="submit" form="shift-calendar-form" label="Save" color="primary" :loading="loading" />
      </div>
    </template>
  </UModal>
</template>