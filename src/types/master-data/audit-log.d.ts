
export interface AuditLogUser {
  id: number
  email: string
}

export interface AuditLogModule {
  id: number
  name: string
  code: string
}

export interface AuditLogActivity {
  id: number
  name: string
  code: string
}

export interface AuditLog {
  id: string
  user_id: number
  module_id: number
  activity_id: number
  resource_id: string
  old_data: Record<string, any> | null
  new_data: Record<string, any> | null
  ip_address: string
  user_agent: string
  description: string
  createdAt: string
  updatedAt: string
  deleted_at?: string | null
  user?: AuditLogUser
  module?: AuditLogModule
  activity?: AuditLogActivity
}

export interface AuditLogParams {
  page?: number
  limit?: number
  search?: string
  start_date?: string
  end_date?: string
  module_id?: number
  activity_id?: number
  user_id?: number
  [key: string]: any
}
