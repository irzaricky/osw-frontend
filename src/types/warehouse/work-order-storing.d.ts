import type { WarehouseArea } from '../master-data/warehouse-area'
import type { User } from '../master-data/user'
import type { WorkOrderStoringItem } from './work-order-storing-item'

export type WorkOrderStoringCategory = 'Placement' | 'Take Out'

export interface WorkOrderStoringStatus {
  id: number
  name: string
}

export interface WorkOrderStoringType {
  id: number
  name: string
}

export interface StationDropdown {
  id: number
  station_code: string
  name: string

  materials: StationMaterial[]
}

export interface StationMaterial {
  part_id: number
  part_number: string
  part_name: string
  qty_per_kanban: number

  uom: {
    id: number
    code: string
    name: string
  } | null

  areas: {
    id: number
    area_code: string
    name: string
    available_stock: number
  }[]

  // Production
  required_qty?: number
  supplied_qty?: number
  remaining_qty?: number
  buffer_stock?: number
  max_kanban?: number

  // Buffer
  current_buffer_stock?: number
  min_buffer_stock?: number
  refill_qty?: number
}

export interface ProductionWODropdown {
  id: number
  wo_number: string
  part_number: string
  planned_quantity: number
}

export interface WorkOrderStoring {
  id: number

  wo_number: string
  wo_category: WorkOrderCategory

  take_out_purpose?: 'production' | 'buffer'
  production_wo_id?: number | null
  station_id?: number | null

  ref_doc_id?: number | null
  ref_doc_number?: string | null
  ref_doc_name?: string | null

  wo_date: string
  wo_description?: string | null

  wo_type_id: number
  warehouse_area_id: number
  wo_status_id: number
  created_by?: number | null

  status?: WorkOrderStatus
  type?: WorkOrderType
  user?: User
  area?: Pick<WarehouseArea, 'id' | 'name'> | null
  items?: WorkOrderStoringItem[]

  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}