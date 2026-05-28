export interface GoodReceipt {
  id: number
  po_number: string | null
  do_number: string | null
  supplier: string | null
  arrived_at: string | null
  total_part: number
  accepted_label: number
  gr_status: | 'Waiting GR Approval' | 'Good Receipt'
  gr_remarks: string | null
}

export interface GoodReceiptSummary {
  expected: number
  accepted: number
  rejected: number
  submitted_at: | string | null
}

export interface GoodReceiptQuantityLabel {
  id: number
  label_number: | string | null
  judgement: | 'OK' | 'NG'
  expected_qty: number
  actual_qty: number
  ng_ticket_number: | string | null
  scanned_at: | string | null
}

export interface GoodReceiptDefect {
  id: number
  defect_id: | number | null
  defect_name: | string | null
  image: | string | null
}

export interface GoodReceiptQualityLabel {
  id: number
  label_number: | string | null
  judgement: | 'OK' | 'NG'
  defects: GoodReceiptDefect[]
  ng_ticket_number: | string | null
  scanned_at: | string | null
}

export interface GoodReceiptPart {
  mr_item_id: number
  part_number: | string | null
  part_name: | string | null
  quantity_summary: GoodReceiptSummary
  quality_summary: GoodReceiptSummary
  quantity_labels: GoodReceiptQuantityLabel[]
  quality_labels: GoodReceiptQualityLabel[]
}

export interface GoodReceiptDetail {
  po_number: | string | null
  do_number: | string | null
  supplier: | string | null
  warehouse: | string | null
  arrived_at: | string | null
  gr_status: | string | null
  parts: GoodReceiptPart[]
}