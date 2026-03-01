import type { Line } from './line'

export interface StationType {
  id: number
  name: string
}

export interface Station {
  id: number
  station_code: string
  name: string
  line_id: number
  line?: Pick<Line, 'id' | 'name'>
  station_type_id: number
  station_type?: StationType
  sequence: number
  status: boolean
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}

export interface StationJob {
  id: number
  station_id: number
  job_id: number
  job?: {
    id: number
    job_code: string
    name: string
    standard_time: number
  }
  sequence: number
  mandatory: boolean
  active: boolean
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}