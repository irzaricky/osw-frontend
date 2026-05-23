import { api } from '../../plugins/axios'

export interface SpoParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  start_date?: string
  end_date?: string
  [key: string]: any
}

const BASE = '/sales/spo'

const spoService = {
  // ─── List & Detail ────────────────────────────────────────────────────────
  getSpos(params?: SpoParams) {
    return api.get(`${BASE}/`, { params })
  },

  getSpoById(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  // ─── Dropdowns ────────────────────────────────────────────────────────────
  ddStatus() {
    return api.get(`${BASE}/dd-status`)
  },

  ddCustomers() {
    return api.get(`${BASE}/dd-customer`)
  },

  listSpr() {
    return api.get(`${BASE}/list-spr`)
  },

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  createSpo(data: FormData) {
    return api.post(`${BASE}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  updateSpo(id: number | string, data: Record<string, any>) {
    return api.put(`${BASE}/${id}`, data)
  },

  deleteSpo(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  },

  // ─── Workflow ─────────────────────────────────────────────────────────────
  updateStatus(id: number | string, data: { status: string; remarks?: string }) {
    return api.put(`${BASE}/${id}/status`, data)
  },

  // ─── SDO History ─────────────────────────────────────────────────────────
  getSdoHistory(id: number | string) {
    return api.get(`${BASE}/${id}/sdo-history`)
  },

  // ─── PDF Download ─────────────────────────────────────────────────────────
  downloadPdf(id: number | string) {
    return api.get(`${BASE}/${id}/pdf`, { responseType: 'blob' })
  }
}

export default spoService
