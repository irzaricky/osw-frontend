import type { AvatarProps } from '@nuxt/ui'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

export interface User {
  id: number
  username: string
  email: string
  password?: string // Optional for update
  role_id: number
  role_name?: string // Optional if fetched with role
  active?: boolean
  role?: {
    id: number
    name: string
    division?: {
        id: number
        name: string
    }
  }
  full_name?: string
  phone_number?: string
  factory_id?: number
  factory_name?: string
  line_id?: number
  line_name?: string
  created_at?: string
  updated_at?: string
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

