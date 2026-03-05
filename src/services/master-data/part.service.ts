import { api } from '../../plugins/axios'
import type { Parts } from '../../types/master-data/parts'

export interface PartsParams {
  page?: number
  limit?: number
  search?: string
  [key: string]: any
}

const BASE = '/master-data/parts'
const SUPPLIER_BASE = '/master-data/suppliers'

const partService = {
  getParts(params?: PartsParams) {
    return api.get(`${BASE}/`, { params })
  },

  getPartsById(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  getDropdown(params?: Record<string, any>) {
    return api.get(`${BASE}/dropdown`, { params })
  },

  ddTypes() {
    return api.get(`${BASE}/dd-types`)
  },

  ddSuppliers(params?: Record<string, any>) {
    return api.get(`${SUPPLIER_BASE}/dropdown`, { params })
  },

  createPart(data: Partial<Parts>) {
    return api.post(`${BASE}/`, data)
  },

  updatePart(id: number | string, data: Partial<Parts>) {
    return api.put(`${BASE}/${id}`, data)
  },

  deletePart(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  },

  downloadParts(params?: PartsParams) {
    return api.get(`${BASE}/download`, { params, responseType: 'blob' })
  },

  uploadPart(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`${BASE}/upload`, formData, {
      headers: { 'Content-Type': null }
    })
  }
}

export default partService