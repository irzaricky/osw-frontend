import type { Factory } from './factory'

export interface Line {
  id: number
  line_code: string
  name: string
  factory_id: number
  factory?: Pick<Factory, 'id' | 'name'>
  sequence: number
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}