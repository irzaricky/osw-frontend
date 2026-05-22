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
  // ─── List & Detail ────────────────────────────────────────────────────────
  getMpos(params?: MpoParams) {
    return api.get(`${BASE}/`, { params })
  },

  getMpoById(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  // ─── Dropdowns ────────────────────────────────────────────────────────────
  ddStatus() {
    return api.get(`${BASE}/dd-status`)
  },

  ddSource() {
    return api.get(`${BASE}/dd-source`)
  },

  ddSupplier(params?: { search?: string; part_ids?: string }) {
    return api.get(`${BASE}/dd-supplier`, { params })
  },

  // ─── Source Data (pre-fill form from MPR or MRP) ──────────────────────────
  getSourceData(sourceType: 'mpr' | 'mrp', sourceId: number | string) {
    return api.get(`${BASE}/source-data/${sourceType}/${sourceId}`)
  },

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  createMpo(data: Record<string, any>) {
    return api.post(`${BASE}/`, data)
  },

  updateMpo(id: number | string, data: Record<string, any>) {
    return api.put(`${BASE}/${id}`, data)
  },

  deleteMpo(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  },

  // ─── Workflow ─────────────────────────────────────────────────────────────
  updateStatus(id: number | string, data: { status: string; remarks?: string }) {
    return api.put(`${BASE}/${id}/status`, data)
  },

  // ─── MDO History ─────────────────────────────────────────────────────────
  getMdoHistory(id: number | string) {
    return api.get(`${BASE}/${id}/mdo-history`)
  }
}

export default mpoService