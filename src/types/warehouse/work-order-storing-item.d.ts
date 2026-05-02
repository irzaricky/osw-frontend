import type { Part } from '../master-data/part'
import type { WorkOrderStoringItemLabel } from './work-order-storing-item-label'
import type { WorkOrderStoring } from './work-order-storing'

export interface WorkOrderStoringItem {
  id: number

  wo_id: number
  part_id: number

  total_kanban: number
  is_scanned_in: boolean
  is_scanned_out: boolean

  work_order?: WorkOrderStoring
  part?: Part
  item_labels?: WorkOrderStoringItemLabel[]

  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}