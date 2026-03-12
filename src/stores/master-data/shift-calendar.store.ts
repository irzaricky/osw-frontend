import { defineStore } from 'pinia'
import { ref } from 'vue'
import shiftCalendarService, { type ShiftCalendarParams } from '../../services/master-data/shift-calendar.service'
import type { ShiftCalendar, CalendarType } from '../../types/master-data/shift-calendar'

export const useShiftCalendarStore = defineStore('shiftCalendar', () => {
  const shiftCalendars = ref<ShiftCalendar[]>([])
  const calendarTypes = ref<CalendarType[]>([])
  const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCalendarTypes() {
    try {
      const { data } = await shiftCalendarService.getDdCalendarType()
      if (data.status) calendarTypes.value = data.data
    } catch (e: any) {
      console.error('[shiftCalendarStore] fetchCalendarTypes:', e)
    }
  }

  async function fetchShiftCalendars(params: ShiftCalendarParams = {}) {
    loading.value = true
    error.value = null
    try {
      const { data } = await shiftCalendarService.getShiftCalendars(params)
      if (data.status) {
        shiftCalendars.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages,
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
    } finally {
      loading.value = false
    }
  }

  async function createShiftCalendar(payload: Partial<ShiftCalendar>) {
    loading.value = true
    error.value = null
    try {
      const { data } = await shiftCalendarService.createShiftCalendar(payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateShiftCalendar(id: number | string, payload: Partial<ShiftCalendar>) {
    loading.value = true
    error.value = null
    try {
      const { data } = await shiftCalendarService.updateShiftCalendar(id, payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteShiftCalendar(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await shiftCalendarService.deleteShiftCalendar(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function downloadShiftCalendars(params: ShiftCalendarParams = {}) {
    loading.value = true
    error.value = null
    try {
      const { data } = await shiftCalendarService.downloadShiftCalendars(params)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function uploadShiftCalendars(file: File) {
    loading.value = true
    error.value = null
    try {
      const { data } = await shiftCalendarService.uploadShiftCalendars(file)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    shiftCalendars, calendarTypes, meta, loading, error,
    fetchCalendarTypes,
    fetchShiftCalendars, createShiftCalendar, updateShiftCalendar, deleteShiftCalendar,
    downloadShiftCalendars, uploadShiftCalendars,
  }
})