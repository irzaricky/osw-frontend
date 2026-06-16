export interface ForecastDetail {
  id: number
  forecast_id: number
  forecast_detail_number: string
  part_id: number
  period_date: string
  qty_status: string
  forecast_qty: number
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
  part?: {
    id: number
    part_number: string
    part_name: string
  }
}

export interface Forecast {
  id: number
  forecast_number: string
  forecast_type: string
  customer_id: number
  start_period: string
  end_period: string
  description: string
  version: string
  status: string
  copied_from_id?: number | null
  created_by: number
  approved_by?: number | null
  approved_at?: string | null
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
  fill_completeness?: number | string
  customer?: {
    id: number
    customer_code: string
    name: string
  }
  staff?: {
    id: number
    email: string
    user_detail?: {
      full_name: string
    }
  }
  approver?: {
    id: number
    email: string
    user_detail?: {
      full_name: string
    }
  }
  details?: ForecastDetail[]
  logs?: any[]
}
