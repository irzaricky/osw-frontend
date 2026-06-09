import { api } from '../../plugins/axios'
import type { Mrp } from '../../types/material/mrp'

export interface MrpParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  spr_id?: number
  [key: string]: any
}

const BASE = '/material/mrp'

const mrpService = {
  getMrps(params?: MrpParams) {
    return api.get(`${BASE}/`, { params })
  },

  getMrpById(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  ddSalesPlans(params?: Record<string, any>) {
    return api.get(`${BASE}/dropdown/sales-plans`, { params })
  },

  ddParts(params?: Record<string, any>) {
    return api.get(`${BASE}/dropdown/parts`, { params })
  },

  ddStatus(params?: Record<string, any>) {
    return api.get(`${BASE}/dropdown/status`, { params })
  },

  ddPriority(params?: Record<string, any>) {
    return api.get(`${BASE}/dropdown/priority`, { params })
  },

  loadSalesPlan(sprId: number | string) {
    return api.get(`${BASE}/sales-plan/${sprId}/load`)
  },

  createMrp(data: Partial<Mrp> & { details?: any[]; save_as_draft?: boolean }) {
    return api.post(`${BASE}/`, data)
  },

  getDashboardCriticalParts() {
    return api.get(`${BASE}/dashboard/critical-parts`)
  },

  updateMrp(id: number | string, data: Partial<Mrp> & { save_as_draft?: boolean }) {
    return api.put(`${BASE}/${id}`, data)
  },

  updateMrpDetail(id: number | string, data: { details: any[] }) {
    return api.put(`${BASE}/${id}/detail`, data)
  },

  submitMrp(id: number | string) {
    return api.put(`${BASE}/${id}/submit`)
  },

  reviewMrp(id: number | string, data: { action: 'approve' | 'reject'; notes?: string }) {
    return api.put(`${BASE}/${id}/review`, data)
  },

  bulkReviewMrp(data: { ids: number[]; action: 'approve' | 'reject'; notes?: string }) {
    return api.put(`${BASE}/bulk-review`, data)
  },

  deleteMrp(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  }
}

export default mrpService