import type { Part } from '../master-data/part'
import type { WorkOrderStoringItem } from './work-order-storing-item'

export interface PartLabel {
  id: number
  label_number: string
  part_id: number

  part?: Part

  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}

export interface WorkOrderStoringItemLabel {
  id: number

  wo_item_id: number
  label_id: number

  is_scanned_in: boolean
  is_scanned_out: boolean

  work_order_item?: WorkOrderStoringItem
  label?: PartLabel

  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}