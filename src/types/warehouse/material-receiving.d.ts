import type { Warehouse } from '../master-data/warehouse'
import type { Dock } from '../master-data/dock'
import type { Suppliers } from '../master-data/suppliers'
import type { Parts } from '../master-data/parts'

export interface MaterialReceivingStatus {
  id: number
  name: string
}

export interface MaterialReceiving {
  id: number
  number: string
  target_date: string
  supplier: string
  warehouse: string
  dock: string
  transporter: string
  arrived_at: string
  status: string
}

export interface MaterialReceivingDetail {
  id: number
  number: string
  description: string
  supplier: Pick<Suppliers, 'id' | 'name'> | null
  warehouse: Pick<Warehouse, 'id' | 'name'> | null
  dock: Pick<Dock, 'id' | 'name'> | null
  transporter: string
  target_date: string
  arrived_at: string
  status: string

  remarks?: string | null

  items: MaterialReceivingItem[]
}

export interface MaterialReceivingItem {
  id: number
  part: Pick<Parts, 'id' | 'part_number' | 'part_name'> | null
  qty: number
}

export interface MaterialReceivingDropdown {
  id: number
  number: string
  supplier_name: string
}

export interface MaterialReceivingProgressItem {
  id: number
  mdo_detail_id: number
  part_number: string
  part_name: string
  total_qty: string
  total_qty_actual: number
  quantity_checked_at: string | null
  quality_check_ok: number
  quality_check_ng: number
  quality_checked_at: string | null
}

export interface MaterialReceivingProgress {
  id: number
  number: string
  status: string
  target_date: string
  arrived_at: string | null
  warehouse: string
  dock: string
  items: MaterialReceivingProgressItem[]
}

export interface QuantityCheckingLabel {
  id: number
  label_number: string | null
  judgement: 'OK' | 'NG'
  scanned_at: string | null

  ng_ticket: {
    id: number
    ng_ticket_number: string
    expected_qty: number | null
    actual_qty: number | null
  } | null
}

export interface QuantityCheckingPart {
  part_number: string | null
  part_name: string | null
  qty_per_kanban: number | null
  total_qty: number
  checked_qty: number
  remaining_qty: number
}

export interface QuantityCheckingDetail {
  id: number
  mr_item_id: number
  mdo_number: string | null
  warehouse: string | null
  dock: string | null
  target_date: string | null
  arrived_at: string | null
  submitted_at: string | null
  part: QuantityCheckingPart
  labels: QuantityCheckingLabel[]
}

export interface QualityCheckingDefect {
  id: number
  defect_id: number
  defect_name: string
  image: string | null
}

export interface QualityCheckingNgTicket {
  id: number
  ng_ticket_number: string
  defects: QualityCheckingDefect[]
}

export interface QualityCheckingLabel {
  id: number
  label_number: string | null
  judgement: 'OK' | 'NG'
  scanned_at: string | null
  ng_ticket: QualityCheckingNgTicket | null
}

export interface QualityCheckingPart {
  part_number: string | null
  part_name: string | null
  qty_per_kanban: number | null
  total_qty: number
  checked_qty: number
  remaining_qty: number
}

export interface QualityCheckingDetail {
  id: number
  mr_item_id: number
  mdo_number: string | null
  warehouse: string | null
  dock: string | null
  target_date: string | null
  arrived_at: string | null
  submitted_at: string | null
  part: QualityCheckingPart
  labels: QualityCheckingLabel[]
}

export interface QualityCheckingDefectPayload {
  defect_id: number
  image?: string | null
}

export interface MarkQualityDefectPayload {
  defects: QualityCheckingDefectPayload[]
}