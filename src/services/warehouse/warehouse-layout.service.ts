import { api } from '../../plugins/axios'
import type { AreaLayoutPayload } from '../../types/warehouse/warehouse-layout'

export interface WarehouseLayoutParams {
  page?: number
  limit?: number
  search?: string
  [key: string]: any
}

export interface StorageBinDetailParams {
  page?: number
  limit?: number
  search?: string
  [key: string]: any
}

const warehouseLayoutService = {
  // Warehouse Layout
  getLayouts(params?: WarehouseLayoutParams) {
    return api.get('/warehouse/warehouse-layout', { params })
  },
  getLayout(id: number | string) {
    return api.get(`/warehouse/warehouse-layout/${id}`)
  },
  createLayout(data: { warehouse_id: number }) {
    return api.post('/warehouse/warehouse-layout', data)
  },

  // Area Layout
  getAreaLayout(id: number | string) {
    return api.get(`/warehouse/warehouse-layout/area-layout/${id}`)
  },
  addAreaLayout(layoutId: number | string, data: Partial<AreaLayoutPayload>) {
    return api.post(`/warehouse/warehouse-layout/${layoutId}/area-layout`, data)
  },
  updateAreaLayout(id: number | string, data: Partial<AreaLayoutPayload>) {
    return api.put(`/warehouse/warehouse-layout/area-layout/${id}`, data)
  },
  deleteAreaLayout(id: number | string) {
    return api.delete(`/warehouse/warehouse-layout/area-layout/${id}`)
  },

  // Storage Bin Detail
  getStorageBinDetail(id: number | string, params?: StorageBinDetailParams) {
    return api.get(`/warehouse/warehouse-layout/storage-bin/${id}`, { params })
  }
}

export default warehouseLayoutService