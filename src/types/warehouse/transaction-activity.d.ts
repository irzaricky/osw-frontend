export type TransactionActivityType = 'IN' | 'OUT'

export interface TransactionActivity {
  id: number
  activity_type: TransactionActivityType

  wo_id?: number | null
  wo_number?: string | null
  wo_date?: string | null
  wo_type?: string | null
  wo_category?: string | null

  part_id?: number | null
  part_number?: string | null
  part_name?: string | null
  part_category?: string | null

  label_id?: number | null
  label_number?: string | null

  kanban: number
  qty_per_kanban: number

  warehouse_area_id?: number | null
  warehouse_area?: string | null

  storage_bin_origin?: string | null
  storage_bin_destination?: string | null
  bin_id?: number | null
  bin_code?: string | null

  timestamp_activity?: string | null

  user_id?: number | null
  user?: string | null

  qr_part?: string | null
  qr_bin?: string | null
}