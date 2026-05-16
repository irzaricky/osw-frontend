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