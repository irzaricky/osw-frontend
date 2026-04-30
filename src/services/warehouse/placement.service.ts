import { api } from '../../plugins/axios'

export interface PlacementParams {
  page?: number
  limit?: number
  search?: string
  warehouse_area_id?: number
  wo_status_id?: number
  wo_type_id?: number
  wo_date?: string
  [key: string]: any
}

export interface ValidateLabelPayload {
  label_number: string
}

export interface PlaceBinPayload {
  label_number: string
  bin_code: string
  qty_per_kanban?: number
}

const placementService = {
  getPlacements(params?: PlacementParams) {
    return api.get('/warehouse/placement', { params })
  },

  getPlacementDetail(id: number | string) {
    return api.get(`/warehouse/placement/${id}`)
  },

  validateLabel(id: number | string, data: ValidateLabelPayload) {
    return api.post(`/warehouse/placement/${id}/scan-label`, data)
  },

  getAvailableBins(id: number | string, params?: Record<string, any>) {
    return api.get(`/warehouse/placement/${id}/bins`, { params })
  },

  placeBin(id: number | string, data: PlaceBinPayload) {
    return api.post(`/warehouse/placement/${id}/place-bin`, data)
  }
}

export default placementService