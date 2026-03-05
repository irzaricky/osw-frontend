export interface CalendarType {
  id: number
  code: string
  name: string
  is_holiday: boolean
}

export interface CalendarEvent {
  id?: number
  date: string // YYYY-MM-DD
  description: string | null
  createdAt?: string
  updatedAt?: string
  ref_type_calendar_id?: number
  type_calendar?: CalendarType
}

export interface CalendarStoreState {
  events: CalendarEvent[]
  loading: boolean
  error: string | null
  dropdownTypes: Pick<CalendarType, 'id' | 'name' | 'code' | 'is_holiday'>[]
}
