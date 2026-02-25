<script setup lang="ts">
import { ref, watch, unref } from 'vue'
import { useCalendarStore } from '../../../../stores/master-data/calendar.store'
import type { CalendarEvent } from '../../../../types/master-data/calendar'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  event: Partial<CalendarEvent>
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save', data: any): void
  (e: 'delete', date: string): void
}>()

const calendarStore = useCalendarStore()

const state = ref({
  date: '',
  ref_type_calendar_id: undefined as number | undefined,
  description: ''
})

watch(() => props.open, (newVal) => {
  if (newVal) {
    state.value = {
      date: props.event.date || '',
      ref_type_calendar_id: props.event.ref_type_calendar_id,
      description: props.event.description || ''
    }
  }
})

function close() {
  emit('update:open', false)
}

function handleSave() {
  emit('save', unref(state))
}
</script>

<template>
  <UModal 
    :open="open" 
    :title="mode === 'add' ? 'Add Calendar Event' : 'Edit Calendar Event'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Date -->
        <UFormField label="Date (YYYY-MM-DD)" required>
          <UInput
            v-model="state.date"
            placeholder="e.g. 2026-02-01"
            type="date"
            class="w-full"
            :disabled="mode === 'edit'"
          />
        </UFormField>

        <!-- Calendar Type -->
        <UFormField label="Calendar Type" required>
          <USelect
            v-model="state.ref_type_calendar_id"
            :items="calendarStore.dropdownTypes"
            value-key="id"
            label-key="name"
            placeholder="Select Type"
            class="w-full"
          />
        </UFormField>

        <!-- Description -->
        <UFormField label="Description">
          <UTextarea
            v-model="state.description"
            placeholder="Enter description..."
            :rows="3"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between w-full">
        <div>
          <UButton
            v-if="mode === 'edit'"
            color="error"
            variant="ghost"
            label="Delete"
            icon="i-lucide-trash"
            @click="emit('delete', state.date)"
          />
        </div>
        <div class="flex gap-3">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="close" />
          <UButton
            color="primary"
            :label="mode === 'add' ? 'Save' : 'Update'"
            :loading="loading"
            :disabled="!state.date || !state.ref_type_calendar_id"
            @click="handleSave"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
