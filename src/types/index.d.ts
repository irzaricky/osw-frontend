import type { AvatarProps } from '@nuxt/ui'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

export interface UserDetail {
  id: number
  user_id: number
  employee_number?: string
  full_name?: string
  phone_number?: string
  factory_id?: number
  line_id?: number
  factory?: { id: number; name: string }
  line?: { id: number; name: string }
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}

export interface User {
  id: number
  email: string
  password?: string
  role_id: number
  active?: boolean
  role?: {
    id: number
    name: string
    division?: {
      id: number
      name: string
    }
  }
  user_detail?: UserDetail
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
  
  // Flat fields used for create/update form payload
  full_name?: string
  phone_number?: string
  employee_number?: string
  factory_id?: number
  line_id?: number
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
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

