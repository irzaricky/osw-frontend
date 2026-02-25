<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useCalendarStore } from '../../../stores/master-data/calendar.store'
import { useAppToast } from '../../../composables/useAppToast'
import type { CalendarEvent } from '../../../types/master-data/calendar'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import CalendarFilters from './components/CalendarFilters.vue'
import CalendarFormModal from './components/CalendarFormModal.vue'
import VisualCalendar from './components/VisualCalendar.vue'

// Store and Toast
const calendarStore = useCalendarStore()
const { events, loading } = storeToRefs(calendarStore)
const { toastSuccess, toastError } = useAppToast()

// State - Date filtering
const currentMonth = ref(new Date().getMonth() + 1)
const currentYear = ref(new Date().getFullYear())

// Modal state
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')

function createEmptyEvent(): Partial<CalendarEvent> {
  return {
    date: '',
    ref_type_calendar_id: undefined,
    description: ''
  }
}

const currentEvent = reactive<Partial<CalendarEvent>>(createEmptyEvent())

// Confirm dialog state
const confirmDialog = reactive({
  open: false,
  title: '',
  description: '',
  action: null as (() => Promise<void>) | null
})



// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Master Data' },
  { label: 'Calendar' }
]

// Computed
const startEndDateObj = computed(() => {
  const start = new Date(currentYear.value, currentMonth.value - 1, 1)
  const end = new Date(currentYear.value, currentMonth.value, 0) // last day of month
  
  const yyyyStart = start.getFullYear()
  const mmStart = String(start.getMonth() + 1).padStart(2, '0')
  const ddStart = String(start.getDate()).padStart(2, '0')

  const yyyyEnd = end.getFullYear()
  const mmEnd = String(end.getMonth() + 1).padStart(2, '0')
  const ddEnd = String(end.getDate()).padStart(2, '0')

  return {
    start_date: `${yyyyStart}-${mmStart}-${ddStart}`,
    end_date: `${yyyyEnd}-${mmEnd}-${ddEnd}`
  }
})



// Data Fetching
async function fetchData() {
  await calendarStore.fetchCalendars(startEndDateObj.value)
}

// Filter handling
function handleFilterUpdate(val: { month: number, year: number }) {
  currentMonth.value = val.month
  currentYear.value = val.year
}

watch([currentMonth, currentYear], () => {
  fetchData()
})

// Modal Handlers
function openAddModal(dateStr?: string) {
  modalMode.value = 'add'
  Object.assign(currentEvent, createEmptyEvent())
  if (dateStr && typeof dateStr === 'string') {
    currentEvent.date = dateStr
  }
  isModalOpen.value = true
}

function openEditModal(event: CalendarEvent) {
  modalMode.value = 'edit'
  Object.assign(currentEvent, {
    date: event.date,
    ref_type_calendar_id: event.ref_type_calendar_id || event.type_calendar?.id,
    description: event.description || ''
  })
  isModalOpen.value = true
}

async function handleSave(data: any) {
  try {
    const res = await calendarStore.upsertCalendar({
      date: data.date,
      ref_type_calendar_id: data.ref_type_calendar_id,
      description: data.description || null
    })
    
    toastSuccess(res.message || 'Calendar event saved')
    isModalOpen.value = false
    fetchData()
  } catch (err: any) {
    toastError(err)
  }
}

// Delete Handler
async function handleDeleteDate(dateStr: string) {
  confirmDialog.title = 'Delete Event'
  confirmDialog.description = `Are you sure you want to delete the event on ${dateStr}? This action cannot be undone.`
  confirmDialog.action = async () => {
    try {
      const res = await calendarStore.deleteCalendar(dateStr)
      toastSuccess(res.message || 'Event deleted')
      fetchData()
      confirmDialog.open = false
      isModalOpen.value = false
    } catch (err) {
      toastError(err)
      confirmDialog.open = false
    }
  }
  confirmDialog.open = true
}

// Visual Calendar interactions
function handleDateClick(dateStr: string) {
  openAddModal(dateStr)
}

function handleEventClick(event: CalendarEvent) {
  openEditModal(event)
}

// Lifecycle
onMounted(() => {
  calendarStore.fetchDropdownTypes()
  fetchData()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Breadcrumbs -->
    <Breadcrumbs :items="breadcrumbItems" />

    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Calendar Master Data
      </h1>
      
      <div class="flex items-center gap-4">
        <CalendarFilters 
          :month="currentMonth"
          :year="currentYear"
          @update="handleFilterUpdate"
        />
      </div>
    </div>

    <!-- Main Content -->
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
      <VisualCalendar
        :month="currentMonth"
        :year="currentYear"
        :events="events"
        @date-click="handleDateClick"
        @event-click="handleEventClick"
      />
    </div>

    <!-- Form Modal -->
    <CalendarFormModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :event="currentEvent"
      :loading="loading"
      @save="handleSave"
      @delete="handleDeleteDate"
    />

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-model:open="confirmDialog.open"
      :title="confirmDialog.title"
      :description="confirmDialog.description"
      confirm-label="Delete"
      :loading="loading"
      @confirm="confirmDialog.action?.()"
    />
  </div>
</template>
