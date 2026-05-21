export interface WarrantyClaimQuantity {
  expected_qty: number
  actual_qty: number
}

export interface WarrantyClaimDefect {
  id: number

  defect_id: number | null

  defect_name: string | null

  image: string | null
}

export interface WarrantyClaim {
  no: number

  id: number

  ng_ticket_number: string

  category:
    | 'Quantity'
    | 'Quality'

  po_number: string | null

  do_number: string | null

  supplier: string | null

  label_number: string | null

  quantity:
    WarrantyClaimQuantity | null

  defects:
    WarrantyClaimDefect[]

  created_at: string
}