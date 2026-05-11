import { api } from '../../plugins/axios'

export interface SprParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  source?: string
  part_id?: number
  [key: string]: any
}

const BASE = '/sales/spr'

const sprService = {
  // List
  getSprs(params?: SprParams) {
    return api.get(`${BASE}/`, { params })
  },

  getSprById(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  // Dropdowns
  ddParts(params?: Record<string, any>) {
    return api.get(`${BASE}/dd-part`, { params })
  },

  ddStatus(params?: Record<string, any>) {
    return api.get(`${BASE}/dd-status`, { params })
  },

  ddSource(params?: Record<string, any>) {
    return api.get(`${BASE}/dd-source`, { params })
  },

  // CRUD
  createSpr(data: Record<string, any>) {
    return api.post(`${BASE}/`, data)
  },

  updateSpr(id: number | string, data: Record<string, any>) {
    return api.put(`${BASE}/${id}`, data)
  },

  deleteSpr(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  },

  // Workflow
  submitSpr(id: number | string) {
    return api.put(`${BASE}/${id}/submit`)
  },

  reviewSalesSpr(id: number | string, data: { status: string; remarks?: string }) {
    return api.put(`${BASE}/${id}/review-sales`, data)
  },

  reviewPpicSpr(id: number | string, data: { status: string; remarks?: string }) {
    return api.put(`${BASE}/${id}/review-ppic`, data)
  },

  // Excel
  exportSpr(id: number | string) {
    return api.get(`${BASE}/${id}/export`, { responseType: 'blob' })
  },

  exportLogSnapshot(logId: number | string) {
    return api.get(`${BASE}/log/${logId}/export`, { responseType: 'blob' })
  },

  getTemplate() {
    return api.get(`${BASE}/template`, { responseType: 'blob' })
  },

  uploadTemplate(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`${BASE}/upload`, formData, {
      headers: { 'Content-Type': null }
    })
  },

  // PPIC Aggregation
  getPpicAggregation(params?: { month?: string; part_id?: number }) {
    return api.get(`${BASE}/ppic-aggregation`, { params })
  },

  ppicBatchApprove(data: { month: string; remarks?: string }) {
    return api.put(`${BASE}/ppic-batch-approve`, data)
  }
}

export default sprService
