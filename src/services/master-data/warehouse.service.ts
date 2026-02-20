import { api } from '../../plugins/axios'
import type { Warehouse } from '../../types/master-data/warehouse'

export interface WarehouseParams {
  page?: number
  limit?: number
  search?: string
  line_id?: number
  category_id?: number
  [key: string]: any
}

const warehouseService = {
  // Dropdown
  getWarehouseCategoriesDropdown() {
    return api.get('/master-data/warehouses/dd-warehouse-categories')
  },
  getLinesDropdown() {
    return api.get('/master-data/warehouses/dd-lines')
  },

  // Warehouses
  getWarehouses(params?: WarehouseParams) {
    return api.get('/master-data/warehouses', { params })
  },
  createWarehouse(data: Partial<Warehouse>) {
    return api.post('/master-data/warehouses', data)
  },
  updateWarehouse(id: number | string, data: Partial<Warehouse>) {
    return api.put(`/master-data/warehouses/${id}`, data)
  },
  deleteWarehouse(id: number | string) {
    return api.delete(`/master-data/warehouses/${id}`)
  }
}

export default warehouseService