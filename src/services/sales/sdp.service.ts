/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from '../../plugins/axios'

export interface SdpParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  start_date?: string
  end_date?: string
  [key: string]: any
}

const BASE = '/sales/sdp'

const sdpService = {
  getSdpPlans(params?: SdpParams) {
    return api.get(`${BASE}/`, { params })
  },

  getSdpById(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  getDropdownWarehouses() {
    return api.get(`${BASE}/dd-warehouses`)
  },

  getDropdownDocks() {
    return api.get(`${BASE}/dd-docks`)
  },

  getAvailableSpoItems(params?: { spo_id?: number | string }) {
    return api.get(`${BASE}/available-spo-items`, { params })
  },

  createSdp(data: Record<string, any>) {
    return api.post(`${BASE}/`, data)
  },

  updateSdp(id: number | string, data: Record<string, any>) {
    return api.put(`${BASE}/${id}`, data)
  },

  deleteSdp(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  }
}

export default sdpService
