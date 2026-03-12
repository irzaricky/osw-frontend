import { api } from '../../plugins/axios'
import type { ShiftCalendar } from '../../types/master-data/shift-calendar'

export interface ShiftCalendarParams {
  page?: number
  limit?: number
  shift_id?: number
  line_id?: number
  ref_type_calendar_id?: number
  active?: boolean
  start_date?: string
  end_date?: string
  [key: string]: any
}

const shiftCalendarService = {
  getDdCalendarType() {
    return api.get('/master-data/shift-calendars/dd-calendar-type')
  },

  getShiftCalendars(params?: ShiftCalendarParams) {
    return api.get('/master-data/shift-calendars/', { params })
  },

  createShiftCalendar(data: Partial<ShiftCalendar>) {
    return api.post('/master-data/shift-calendars/', data)
  },

  updateShiftCalendar(id: number | string, data: Partial<ShiftCalendar>) {
    return api.put(`/master-data/shift-calendars/${id}`, data)
  },

  deleteShiftCalendar(id: number | string) {
    return api.delete(`/master-data/shift-calendars/${id}`)
  },

  downloadShiftCalendars(params?: ShiftCalendarParams) {
    return api.get('/master-data/shift-calendars/download', { params, responseType: 'blob' })
  },

  uploadShiftCalendars(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/master-data/shift-calendars/upload', formData, {
      headers: { 'Content-Type': null }
    })
  },
}

export default shiftCalendarService