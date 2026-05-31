export interface WarrantyAndClaimDefect {
  id: number
  defect_name: string
  image: string
}

export interface WarrantyAndClaim {
  id: number
  ng_ticket_number: string | null
  label_number: string | null
  category: string | null
  part_number: string | null
  part_name: string | null
  supplier: string | null
  rejected_info: string | null
  mpo_number: string | null
  mdo_number: string | null
  created_at: string | null
  defects: WarrantyAndClaimDefect[]
}