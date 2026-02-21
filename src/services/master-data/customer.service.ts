import { api } from '../../plugins/axios'
import type { Customer } from '../../types/master-data/customer'

export interface CustomerParams {
  page?: number
  limit?: number
  search?: string
  [key: string]: any
}

const customerService = {
  getCustomers(params?: CustomerParams) {
    return api.get('/master-data/customers/', { params })
  },

  getCustomerById(id: number | string) {
    return api.get(`/master-data/customers/${id}`)
  },

  createCustomer(data: Partial<Customer>) {
    return api.post('/master-data/customers/', data)
  },

  updateCustomer(id: number | string, data: Partial<Customer>) {
    return api.put(`/master-data/customers/${id}`, data)
  },

  deleteCustomer(id: number | string) {
    return api.delete(`/master-data/customers/${id}`)
  },

  downloadCustomers(params?: CustomerParams) {
    return api.get('/master-data/customers/download', { params, responseType: 'blob' })
  }
}

export default customerService
