export interface Dock {
  id: number
  dock_code: string
  name: string
  area: {
    id: number
    name: string
  }
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}