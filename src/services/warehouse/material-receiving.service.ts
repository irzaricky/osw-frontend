import { api } from '../../plugins/axios'

export interface MaterialReceivingParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  status_id?: number
  start_date?: string
  end_date?: string
  [key: string]: any
}

const materialReceivingService = {
  // Dropdown
  getDropdown() {
    return api.get('/warehouse/material-receiving/dropdown')
  },
  getStatusesDropdown() {
    return api.get('/warehouse/material-receiving/statuses/dropdown')
  },

  // Material Delivery Order
  getMaterialReceivings(params?: MaterialReceivingParams) {
    return api.get('/warehouse/material-receiving', { params })
  },
  getMaterialReceiving(id: number | string) {
    return api.get(`/warehouse/material-receiving/${id}`)
  },
  setArrived(id: number | string, payload?: { remarks?: string }) {
    return api.post(`/warehouse/material-receiving/${id}/arrived`, payload)
  },

  // Print
  printLabel(mdo_detail_id: number | string) {
    return api.get(
      `/warehouse/material-receiving/print-label/${mdo_detail_id}`,
      {
        responseType: 'blob'
      }
    )
  }
}

export default materialReceivingService