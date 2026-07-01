<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ShiftCalendar, CalendarType } from '../../../../types/master-data/shift-calendar'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  shiftCalendar: Partial<ShiftCalendar>
  shiftDropdown: { id: number; name: string; shift_number: number }[]
  lineDropdown: { id: number; name: string }[]
  calendarTypes: CalendarType[] // pastikan tipe ini punya field `is_holiday: boolean`
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

const lineItems = computed(() => [props.lineDropdown.map(l => l.name)])
const calendarTypeItems = computed(() => [props.calendarTypes.map(c => c.name)])

// shiftDropdown bisa punya beberapa baris dengan shift_number sama (beda type,
// misal REGULAR vs NON REGULAR). Dedupe per shift_number, ambil baris pertama
// sebagai representasi, lalu tampilkan namanya di dropdown.
const uniqueShiftsByNumber = computed(() => {
  const map = new Map<number, { id: number; name: string; shift_number: number }>()
  for (const s of props.shiftDropdown) {
    if (!map.has(s.shift_number)) map.set(s.shift_number, s)
  }
  return [...map.values()].sort((a, b) => a.shift_number - b.shift_number)
})

const shiftItems = computed(() => [uniqueShiftsByNumber.value.map(s => s.name)])

const selectedShift = computed({
  get: () => {
    // cocokkan berdasarkan shift_number dari shift_id yang tersimpan,
    // lalu ambil nama dari representasi unik-nya
    const current = props.shiftDropdown.find(s => s.id === shift_id.value)
    if (!current) return undefined
    return uniqueShiftsByNumber.value.find(s => s.shift_number === current.shift_number)?.name
  },
  set: (v) => {
    shift_id.value = v ? uniqueShiftsByNumber.value.find(s => s.name === v)?.id : undefined
  },
})

const selectedLine = computed({
  get: () => props.lineDropdown.find(l => l.id === line_id.value)?.name,
  set: (v) => { line_id.value = v ? props.lineDropdown.find(l => l.name === v)?.id : undefined },
})

const selectedCalendarType = computed({
  get: () => props.calendarTypes.find(c => c.id === ref_type_calendar_id.value)?.name,
  set: (v) => {
    ref_type_calendar_id.value = v ? props.calendarTypes.find(c => c.name === v)?.id : undefined
  },
})

// Cek apakah calendar type yang sedang dipilih adalah holiday
const selectedCalendarTypeData = computed(() =>
  props.calendarTypes.find(c => c.id === ref_type_calendar_id.value)
)
const isHolidayType = computed(() => selectedCalendarTypeData.value?.is_holiday ?? false)

// Shift wajib diisi HANYA jika calendar type yang dipilih bukan holiday
const isShiftRequired = computed(() => ref_type_calendar_id.value != null && !isHolidayType.value)

// Validasi sebelum submit (selain UFormField :required yang cuma indikator visual)
const canSubmit = computed(() => {
  if (!ref_type_calendar_id.value) return false
  if (isShiftRequired.value && !shift_id.value) return false
  if (!line_id.value) return false
  if (!date_event.value) return false
  if (!start_date.value || !end_date.value) return false
  return true
})

// Saat calendar type berubah jadi holiday dan shift sebelumnya kosong, tidak perlu diapa-apakan.
// Saat berubah dari holiday -> non-holiday, shift tetap perlu diisi user secara manual
// (tidak di-auto-clear agar tidak kehilangan input yang sudah ada).

function handleSave() {
  if (!canSubmit.value) return
  emit('save', {
    shift_id: shift_id.value ?? null,
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

        <!-- Calendar Type dipindah ke atas, dipilih lebih dulu -->
        <UFormField label="Calendar Type" required>
          <USelectMenu
            v-model="selectedCalendarType"
            :items="calendarTypeItems"
            placeholder="Select calendar type"
            class="w-full"
            clear
            :disabled="loading"
          />
        </UFormField>

        <!-- Shift: required hanya jika calendar type bukan holiday -->
        <UFormField
          label="Shift"
          :required="isShiftRequired"
          :hint="ref_type_calendar_id == null
            ? 'Select calendar type first'
            : (isHolidayType ? 'Optional for holiday calendar type' : undefined)"
        >
          <USelectMenu
            v-model="selectedShift"
            :items="shiftItems"
            placeholder="Select shift"
            class="w-full"
            clear
            :disabled="loading || ref_type_calendar_id == null"
          />
          <p
            v-if="isShiftRequired && !shift_id"
            class="text-xs text-error-600 mt-1"
          >
            Shift is required for this calendar type.
          </p>
        </UFormField>

        <UFormField label="Line" required>
          <USelectMenu
            v-model="selectedLine"
            :items="lineItems"
            placeholder="Select line"
            class="w-full"
            clear
            :disabled="loading"
          />
        </UFormField>

        <UFormField label="Event Name" required>
          <UInput
            v-model="date_event"
            placeholder="e.g. Normal Production"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Start Date" required>
            <UInput
              v-model="start_date"
              type="date"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>
          <UFormField label="End Date" required>
            <UInput
              v-model="end_date"
              type="date"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>
        </div>

        <UFormField label="Status">
          <UCheckbox v-model="active" label="Active" :disabled="loading" />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          :disabled="loading"
          @click="emit('update:open', false)"
        />
        <UButton
          type="submit"
          form="shift-calendar-form"
          label="Save"
          color="primary"
          :loading="loading"
          :disabled="!canSubmit"
        />
      </div>
    </template>
  </UModal>
</template>