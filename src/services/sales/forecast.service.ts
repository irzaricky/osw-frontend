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

  downloadTemplateDetail(forecastType: string) {
    return api.get(`${BASE}/template-detail`, {
      params: { forecast_type: forecastType },
      responseType: 'blob'
    })
  },

  uploadTemplateDetail(file: File, forecastType: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('forecast_type', forecastType)
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

  updateForecastDetail(id: number | string, data: any) {
    return api.put(`${BASE}/${id}/detail`, data)
  },

  deleteForecast(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  },

  submitForecast(id: number | string) {
    return api.put(`${BASE}/${id}/submit`)
  },

  reviewForecast(id: number | string, data: { status: string, remarks?: string }) {
    return api.put(`${BASE}/${id}/review`, data)
  },

  getForecastLogs(id: number | string) {
    return api.get(`${BASE}/${id}/logs`)
  }
}

export default forecastService
