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

export interface WorkOrderStoring {
  id: number

  wo_number: string
  wo_category: WorkOrderCategory

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