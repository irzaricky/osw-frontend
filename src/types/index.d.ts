import type { User } from './master-data/user'
import type { Vehicle, VehicleType } from './master-data/vehicle'
import type { Warehouse } from './master-data/warehouse'
import type { WarehouseArea, WarehouseAreaPayload } from './master-data/warehouse-area'

export type {
  User,
  Vehicle,
  VehicleType,
  WarehouseCategory,
  Warehouse,
  Line,
  WarehousePayload,
  WarehouseArea,
  WarehouseAreaPayload
}

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}
export interface WarehouseAreaPayload {
  warehouse_id: number
  area_code: string
  name: string
  total_cols: number
  total_rows: number
  notes?: string
}
export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

declare module 'vue-router' {
  interface RouteMeta {
    layout?: string
    requiresAuth?: boolean
    isPublic?: boolean
  }
}
