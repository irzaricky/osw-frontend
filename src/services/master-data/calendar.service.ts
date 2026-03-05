import { api } from '../../plugins/axios'


export interface CalendarParams {
  start_date?: string // YYYY-MM-DD
  end_date?: string // YYYY-MM-DD
  [key: string]: any
}

export interface UpsertCalendarPayload {
  date: string
  ref_type_calendar_id: number
  description: string | null
}

const calendarService = {
  getCalendars(params?: CalendarParams) {
    return api.get('/master-data/calendar/', { params })
  },

  getDropdownTypes() {
    return api.get('/master-data/calendar/dd-calendar-type')
  },

  upsertCalendar(data: UpsertCalendarPayload) {
    return api.post('/master-data/calendar/', data)
  },

  deleteCalendar(date: string) {
    return api.delete(`/master-data/calendar/${date}`)
  }
}

export default calendarService
