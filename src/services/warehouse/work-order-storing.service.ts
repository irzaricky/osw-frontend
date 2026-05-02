import { api } from '../../plugins/axios'
import type { WorkOrderStoring } from '../../types/warehouse/work-order-storing'

export interface WorkOrderStoringParams {
  page?: number
  limit?: number
  search?: string
  wo_status_id?: number
  wo_category?: string
  [key: string]: any
}

const workOrderStoringService = {
  // Dropdown
  getTypesDropdown() {
    return api.get('/warehouse/work-order-storing/types/dropdown')
  },
  getStatusesDropdown() {
    return api.get('/warehouse/work-order-storing/statuses/dropdown')
  },

  // Work Order Storing
  getWorkOrders(params?: WorkOrderStoringParams) {
    return api.get('/warehouse/work-order-storing', { params })
  },
  getWorkOrder(id: number | string) {
    return api.get(`/warehouse/work-order-storing/${id}`)
  },
  createWorkOrder(data: Partial<WorkOrderStoring>) {
    return api.post('/warehouse/work-order-storing', data)
  },
  updateWorkOrder(id: number | string, data: Partial<WorkOrderStoring>) {
    return api.put(`/warehouse/work-order-storing/${id}`, data)
  },
  deleteWorkOrder(id: number | string) {
    return api.delete(`/warehouse/work-order-storing/${id}`)
  },

  // Print
  printLabel(wo_item_id: number | string) {
    return api.get(
      `/warehouse/work-order-storing/print-label/${wo_item_id}`,
      {
        responseType: 'blob'
      }
    )
  }
}

export default workOrderStoringService