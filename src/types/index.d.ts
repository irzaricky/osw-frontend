import type { User } from './master-data/user'
import type { Vehicle, VehicleType } from './master-data/vehicle'
import type { Warehouse } from './master-data/warehouse'
import type { WarehouseArea, WarehouseAreaPayload } from './master-data/warehouse-area'
import type { WarehouseBin, WarehouseBinUpdatePayload } from './master-data/warehouse-bin'
import type { PartDropdown } from './master-data/parts'
import type { Factory } from './master-data/factory'
import type { Line } from './master-data/line'


export type {
  User,
  Vehicle,
  VehicleType,
  Warehouse,
  Factory,
  Line,
  WarehouseArea,
  WarehouseAreaPayload,
  WarehouseBin,
  WarehouseBinUpdatePayload,
  PartDropdown
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
