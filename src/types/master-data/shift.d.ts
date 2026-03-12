export interface ShiftType {
  id: string;
  name: string;
}

export interface ShiftCategory {
  id: string;
  name: string;
}

export interface Shift {
  id: number;
  name: string;
  shift_number: string;
  type: string;
  start_time: string;
  end_time: string;
  category: string;
  description?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  deleted_at?: string | null;
}
