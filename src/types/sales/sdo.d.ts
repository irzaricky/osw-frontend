import type { SdpDetail } from './sdp'

export interface SdoDetail {
  id: number
  delivery_order_id: number
  delivery_plan_detail_id: number
  sent_qty: number
  received_qty: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
  planDetail?: SdpDetail
}

export interface Sdo {
  id: number
  do_number: string
  delivery_plan_id: number
  customer_id: number
  vehicle_id: number
  driver_id: number
  shipment_date: string
  delivery_status: 'In Transit' | 'Delivered'
  sla_status?: 'On Time' | 'Near Expiry' | 'Delayed'
  notes: string | null
  proof_of_delivery: string | null
  received_at: string | null
  created_by: number
  createdAt: string
  updatedAt: string
  deleted_at: string | null
  details?: SdoDetail[]
  customer?: {
    id: number
    name: string
    customer_code: string
  }
  vehicle?: {
    id: number
    license_plate: string
  }
  driver?: {
    user_id: number
    full_name: string
  }
  deliveryPlan?: {
    id: number
    dp_number: string
    scheduled_date: string
    time_end?: string
    destination?: string
  }
  creator?: {
    id: number
    email: string
    user_detail?: {
      full_name: string
    }
  }
}

export interface SdoDropdownVehicle {
  id: number
  license_plate: string
  vehicle_type_id: number
  vehicle_type?: {
    id: number
    name: string
    load_capacity: number
  }
}

export interface SdoDropdownDriver {
  user_id: number
  full_name: string
  employee_number?: string
  user?: {
    id: number
    email: string
  }
}
