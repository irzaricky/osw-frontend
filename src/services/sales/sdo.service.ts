/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from '../../plugins/axios'

export interface SdoParams {
  page?: number
  limit?: number
  search?: string
  delivery_status?: string
  start_date?: string
  end_date?: string
  [key: string]: any
}

const BASE = '/sales/sdo'

const sdoService = {
  getSdos(params?: SdoParams) {
    return api.get(`${BASE}/`, { params })
  },

  getSdoById(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  getDropdownVehicles(params?: any) {
    return api.get(`${BASE}/dd-vehicles`, { params })
  },

  getDropdownDrivers(params?: any) {
    return api.get(`${BASE}/dd-drivers`, { params })
  },

  createSdo(data: { delivery_plan_id: number; vehicle_id: number; driver_id: number }) {
    return api.post(`${BASE}/`, data)
  },

  updateSdoStatus(id: number | string, data: FormData) {
    return api.put(`${BASE}/${id}/status`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  uploadLoadingPhoto(id: number | string, data: FormData) {
    return api.put(`${BASE}/${id}/loading-photo`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  approveDispatch(id: number | string) {
    return api.put(`${BASE}/${id}/approve-dispatch`)
  },

  startDelivery(id: number | string) {
    return api.put(`${BASE}/${id}/start-delivery`)
  },

  downloadSdoPdf(id: number | string) {
    return api.get(`${BASE}/${id}/pdf`, { responseType: 'blob' })
  }
}

export default sdoService
