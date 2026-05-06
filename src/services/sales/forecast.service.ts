import { api } from '../../plugins/axios'
import type { Forecast } from '../../types/sales/forecast'

export interface ForecastParams {
  page?: number
  limit?: number
  search?: string
  [key: string]: any
}

const BASE = '/sales/forecast'

const forecastService = {
  getForecasts(params?: ForecastParams) {
    return api.get(`${BASE}/`, { params })
  },

  getForecastById(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  ddCustomers(params?: Record<string, any>) {
    return api.get(`${BASE}/dropdown/customers`, { params })
  },

  ddForecastTypes(params?: Record<string, any>) {
    return api.get(`${BASE}/dropdown/forecast-types`, { params })
  },

  ddStatus(params?: Record<string, any>) {
    return api.get(`${BASE}/dropdown/status`, { params })
  },

  ddParts(params?: Record<string, any>) {
    return api.get(`${BASE}/dropdown/parts`, { params })
  },

  downloadTemplateDetail() {
    return api.get(`${BASE}/template-detail`, { responseType: 'blob' })
  },

  uploadTemplateDetail(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`${BASE}/upload-detail`, formData, {
      headers: { 'Content-Type': null }
    })
  },

  createForecast(data: Partial<Forecast>) {
    return api.post(`${BASE}/`, data)
  },

  updateForecast(id: number | string, data: Partial<Forecast>) {
    return api.put(`${BASE}/${id}`, data)
  },

  deleteForecast(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  },

  approveForecast(id: number | string) {
    return api.put(`${BASE}/${id}/approve`)
  }
}

export default forecastService
