import { api } from '../../plugins/axios'

export interface MprParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  type?: string
  [key: string]: any
}

const BASE = '/material/mpr'

const mprService = {
  // List
  getMprs(params?: MprParams) {
    return api.get(`${BASE}/`, { params })
  },

  getMprById(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  // Dropdowns
  ddParts(params?: Record<string, any>) {
    return api.get(`${BASE}/dropdown/parts`, { params })
  },

  ddStatus(params?: Record<string, any>) {
    return api.get(`${BASE}/dropdown/status`, { params })
  },

  // CRUD
  createMpr(data: Record<string, any>) {
    return api.post(`${BASE}/`, data)
  },

  updateMpr(id: number | string, data: Record<string, any>) {
    return api.put(`${BASE}/${id}`, data)
  },

  deleteMpr(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  },

  // Workflow
  submitMpr(id: number | string) {
    return api.put(`${BASE}/${id}/submit`)
  },

  reviewMpr(id: number | string, data: { action: 'approve' | 'reject'; notes?: string }) {
    return api.put(`${BASE}/${id}/review`, data)
  },

  bulkReviewMpr(data: { ids: number[]; action: 'approve' | 'reject'; notes?: string }) {
    return api.put(`${BASE}/bulk-review`, data)
  }
}

export default mprService