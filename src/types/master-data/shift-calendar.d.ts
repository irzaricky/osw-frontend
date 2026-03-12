export interface CalendarType {
  id: number;
  name: string;
}

export interface ShiftCalendar {
  id: number;
  shift_id: number;
  line_id: number;
  ref_type_calendar_id: number;
  start_date: string;
  end_date: string;
  date_event: string;
  active: boolean;
  shift?: {
    id: number;
    name: string;
    shift_number: number;
    type: string;
    category: string;
  };
  line?: { id: number; name: string };
  type_calendar?: { id: number; name: string };
  createdAt?: string;
  updatedAt?: string;
  deleted_at?: string | null;
}
