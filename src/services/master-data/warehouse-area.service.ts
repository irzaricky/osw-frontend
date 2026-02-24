import { api } from '../../plugins/axios'
import type { WarehouseAreaPayload } from '../../types'

export interface WarehouseAreaParams {
  page?: number
  limit?: number
  search?: string
  warehouse_id?: number
  [key: string]: any
}

const warehouseAreaService = {
  getDropdown() {
    return api.get('/master-data/warehouse_area/dropdown')
  },

  getWarehouseAreas(params?: WarehouseAreaParams) {
    return api.get('/master-data/warehouse_area', { params })
  },

  createWarehouseArea(data: WarehouseAreaPayload) {
    return api.post('/master-data/warehouse_area', data)
  },

  updateWarehouseArea(id: number | string, data: WarehouseAreaPayload) {
    return api.put(`/master-data/warehouse_area/${id}`, data)
  },

  deleteWarehouseArea(id: number | string) {
    return api.delete(`/master-data/warehouse_area/${id}`)
  }
}

export default warehouseAreaService