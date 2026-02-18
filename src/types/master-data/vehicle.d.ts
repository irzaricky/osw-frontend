export interface VehicleType {
  id: number
  name: string
  load_capacity: number
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}

export interface Vehicle {
  id: number
  vehicle_code: string
  plate_number: string
  vehicle_type_id: number
  image?: string
  status?: boolean
  active?: boolean
  vehicle_type?: VehicleType
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}
