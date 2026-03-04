import { api } from '../../plugins/axios'
import type { Suppliers } from '../../types/master-data/suppliers'

export interface SuppliersParams {
  page?: number
  limit?: number
  search?: string
  [key: string]: any
}

const BASE = '/master-data/suppliers'

const supplierService = {
  getSuppliers(params?: SuppliersParams) {
    return api.get(`${BASE}/`, { params })
  },

  getSupplierById(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  getDropdown(params?: Record<string, any>) {
    return api.get(`${BASE}/dropdown`, { params })
  },

  createSupplier(data: Partial<Suppliers>) {
    return api.post(`${BASE}/`, data)
  },

  updateSupplier(id: number | string, data: Partial<Suppliers>) {
    return api.put(`${BASE}/${id}`, data)
  },

  deleteSupplier(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  }
}

export default supplierService