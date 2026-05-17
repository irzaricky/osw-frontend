import type { SpoDetail } from './spo'

export interface SdpDetail {
  id: number
  delivery_plan_id: number
  spo_detail_id: number
  planned_qty: number
  createdAt: string
  updatedAt: string
  deleted_at: string | null
  spoDetail?: SpoDetail
}

export interface Sdp {
  id: number
  dp_number: string
  scheduled_date: string
  time_start: string
  time_end: string
  warehouse_id: number
  dock_id: number
  destination: string
  status: 'Draft' | 'Scheduled' | 'Shipped'
  created_by: number
  createdAt: string
  updatedAt: string
  deleted_at: string | null
  details?: SdpDetail[]
  warehouse?: {
    id: number
    name: string
    code: string
  }
  dock?: {
    id: number
    name: string
  }
  creator?: {
    id: number
    email: string
    user_detail?: {
      full_name: string
    }
  }
}

export interface SdpDropdownWarehouse {
  id: number
  name: string
  code: string
}

export interface SdpDropdownDock {
  id: number
  name: string
  warehouse_id: number
}
