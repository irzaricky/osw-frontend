import { api } from '../../plugins/axios'

export interface TakeOutParams {
  page?: number
  limit?: number
  search?: string
  warehouse_area_id?: number
  wo_status_id?: number
  wo_type_id?: number
  wo_date?: string
  [key: string]: any
}

export interface ScanLabelOutPayload {
  label_number: string,
  fifo_override?: boolean
}

const takeOutService = {
  getTakeOuts(params?: TakeOutParams) {
    return api.get('/warehouse/take-out', { params })
  },

  getTakeOutDetail(id: number | string) {
    return api.get(`/warehouse/take-out/${id}`)
  },

  getRecommendations(id: number | string) {
    return api.get(`/warehouse/take-out/${id}/recommendations`)
  },

  scanLabelOut(id: number | string, data: ScanLabelOutPayload) {
    return api.post(`/warehouse/take-out/${id}/scan-label`, data)
  },
  getWorkOrderTypes() {
  return api.get('/warehouse/placement/dropdown/work-order-types')
  }
}

export default takeOutService