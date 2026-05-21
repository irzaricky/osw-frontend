export interface GoodReceipt {
  no: number

  id: number

  po_number: string | null

  do_number: string | null

  supplier: string | null

  label_qty_inspection: number

  label_quality_inspection: number

  gr_status:
    | 'Waiting GR Approval'
    | 'Good Receipt'

  gr_remarks: string | null
}