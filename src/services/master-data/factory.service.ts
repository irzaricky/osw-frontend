import { api } from '../../plugins/axios'
import type { Factory } from '../../types/master-data/factory'

export interface FactoryParams {
  page?: number
  limit?: number
  search?: string
  [key: string]: any
}

const factoryService = {
  getFactories(params?: FactoryParams) {
    return api.get('/master-data/factories/', { params })
  },

  getFactoryById(id: number | string) {
    return api.get(`/master-data/factories/${id}`)
  },

  createFactory(data: Partial<Factory>) {
    return api.post('/master-data/factories/', data)
  },

  updateFactory(id: number | string, data: Partial<Factory>) {
    return api.put(`/master-data/factories/${id}`, data)
  },

  deleteFactory(id: number | string) {
    return api.delete(`/master-data/factories/${id}`)
  },

  downloadFactories(params?: FactoryParams) {
    return api.get('/master-data/factories/download', { params, responseType: 'blob' })
  },

  uploadFactories(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/master-data/factories/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export default factoryService