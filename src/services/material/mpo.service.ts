import { api } from '../../plugins/axios'

export interface MpoParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  source_type?: string
  start_date?: string
  end_date?: string
  [key: string]: any
}

const BASE = '/material/mpo'

const mpoService = {
  // List & Detail
  getMpos(params?: MpoParams) {
    return api.get(`${BASE}/`, { params })
  },

  getMpoById(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  // Dropdowns
  ddStatus() {
    return api.get(`${BASE}/dd-status`)
  },

  ddSource() {
    return api.get(`${BASE}/dd-source`)
  },

  ddSupplier(params?: { search?: string; part_ids?: string }) {
    return api.get(`${BASE}/dd-supplier`, { params })
  },

  // Source Data (pre-fill form from MPR or MRP)
  getSourceData(sourceType: 'mpr' | 'mrp', sourceId: number | string) {
    return api.get(`${BASE}/source-data/${sourceType}/${sourceId}`)
  },

  // CRUD
  createMpo(data: Record<string, any>) {
    return api.post(`${BASE}/`, data)
  },

  updateMpo(id: number | string, data: Record<string, any>) {
    return api.put(`${BASE}/${id}`, data)
  },

  deleteMpo(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  },

  // Workflow — FIXED: backend menggunakan { action, notes }, bukan { status, remarks }
  updateStatus(id: number | string, data: { action: 'approve' | 'reject'; notes?: string }) {
    return api.put(`${BASE}/${id}/status`, data)
  },

  // Split-update MPO rejected (edit + pindah supplier + split)
  splitUpdateMpo(id: number | string, data: Record<string, any>) {
    return api.put(`${BASE}/${id}/split-update`, data)
  },

  // Bulk Workflow
  bulkSubmitMpo(data: { ids: (number | string)[] }) {
    return api.put(`${BASE}/bulk-submit`, data)
  },

  bulkReviewMpo(data: { ids: (number | string)[]; action: 'approve' | 'reject'; notes?: string }) {
    return api.put(`${BASE}/bulk-review`, data)
  },

  // MDO History
  getMdoHistory(id: number | string) {
    return api.get(`${BASE}/${id}/mdo-history`)
  },

  // Auto-Generate MPO
  autoGenerateMpo(data: Record<string, any>) {
    return api.post(`${BASE}/auto-generate`, data)
  },
}

export default mpoService