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

export interface StationBufferArea {
  id: number
  area_code: string
  name: string
  available_stock: number
}

export interface StationBufferUom {
  id: number
  code: string
  name: string
}

export interface StationBufferMaterial {
  part_id: number
  part_number: string
  part_name: string

  current_buffer_stock: number
  min_buffer_stock: number
  need_refill: number

  qty_per_kanban: number

  uom?: StationBufferUom | null

  areas: StationBufferArea[]
}

export interface StationDropdown {
  id: number
  station_code: string
  name: string

  materials: StationBufferMaterial[]
}

export interface ProductionWOMaterialArea {
  id: number
  area_code: string
  name: string
  available_stock: number
}

export interface ProductionWOMaterial {
  part_id: number
  part_number: string
  part_name: string
  uom: string

  required_qty: number
  supplied_qty: number
  remaining_qty: number

  buffer_stock: number
  max_kanban: number

  areas: ProductionWOMaterialArea[]
}

export interface ProductionWODropdown {
  wo_id: number
  wo_number: string

  planned_quantity: number

  part_id: number
  part_number: string
  part_name: string
  uom: string

  station?: {
    id: number
    name: string
  }

  materials: ProductionWOMaterial[]
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