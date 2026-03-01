import { api } from '../../plugins/axios'
import type { Job } from '../../types/master-data/job'

export interface JobParams {
  page?: number
  limit?: number
  search?: string
  job_type_id?: number
  active?: boolean
  [key: string]: any
}

const jobService = {
  getJobTypes() {
    return api.get('/master-data/jobs/dd-job-type')
  },

  getJobs(params?: JobParams) {
    return api.get('/master-data/jobs/', { params })
  },

  getDropdown() {
    return api.get('/master-data/jobs/dropdown')
  },

  createJob(data: Partial<Job>) {
    return api.post('/master-data/jobs/', data)
  },

  updateJob(id: number | string, data: Partial<Job>) {
    return api.put(`/master-data/jobs/${id}`, data)
  },

  deleteJob(id: number | string) {
    return api.delete(`/master-data/jobs/${id}`)
  },

  downloadJobs(params?: JobParams) {
    return api.get('/master-data/jobs/download', { params, responseType: 'blob' })
  },

  uploadJobs(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/master-data/jobs/upload', formData, {
      headers: { 'Content-Type': null }
    })
  }
}

export default jobService