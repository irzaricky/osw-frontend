export interface JobType {
  id: number
  name: string
  description?: string
}

export interface Job {
  id: number
  job_code: string
  name: string
  job_type_id: number
  job_type?: JobType
  standard_time: number
  active: boolean
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}