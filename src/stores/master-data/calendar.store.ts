import { defineStore } from 'pinia'
import { ref } from 'vue'
import calendarService, { type CalendarParams, type UpsertCalendarPayload } from '../../services/master-data/calendar.service'
import type { CalendarEvent, CalendarType } from '../../types/master-data/calendar'

export const useCalendarStore = defineStore('calendar', () => {
  // State
  const events = ref<CalendarEvent[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Dropdown data
  const dropdownTypes = ref<CalendarType[]>([])

  // Actions
  async function fetchDropdownTypes() {
    try {
      const response = await calendarService.getDropdownTypes()
      const data = response.data
      if (data.status) {
        dropdownTypes.value = data.data
      }
    } catch (e: any) {
      console.error('Error fetching calendar types:', e)
    }
  }

  async function fetchCalendars(params?: CalendarParams) {
    loading.value = true
    error.value = null
    try {
      const response = await calendarService.getCalendars(params)
      const data = response.data
      if (data.status) {
        // The API returns { status: true, data: [...] }
        events.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching calendars:', e)
    } finally {
      loading.value = false
    }
  }

  async function upsertCalendar(data: UpsertCalendarPayload) {
    loading.value = true
    error.value = null
    try {
      const response = await calendarService.upsertCalendar(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteCalendar(date: string) {
    loading.value = true
    error.value = null
    try {
      const response = await calendarService.deleteCalendar(date)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    events,
    loading,
    error,
    dropdownTypes,
    fetchDropdownTypes,
    fetchCalendars,
    upsertCalendar,
    deleteCalendar
  }
})
