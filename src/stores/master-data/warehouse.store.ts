import { defineStore } from 'pinia'
import { ref } from 'vue'
import warehouseService, { type WarehouseParams } from '../../services/master-data/warehouse.service'
import type { Warehouse, WarehouseCategory } from '../../types/master-data/warehouse'

export const useWarehouseStore = defineStore('warehouse', () => {
  // State
  const warehouses = ref<Warehouse[]>([])
  const warehouseCategories = ref<WarehouseCategory[]>([])
  const dropdown = ref<Pick<Warehouse, 'id' | 'name'>[]>([])

  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions - Warehouses
  async function fetchWarehouses(params: WarehouseParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await warehouseService.getWarehouses(params)
      const data = response.data
      if (data.status) {
        warehouses.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching warehouses:', e)
    } finally {
      loading.value = false
    }
  }

  async function createWarehouse(data: Partial<Warehouse>) {
    loading.value = true
    error.value = null
    try {
      const response = await warehouseService.createWarehouse(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateWarehouse(id: number | string, data: Partial<Warehouse>) {
    loading.value = true
    error.value = null
    try {
      const response = await warehouseService.updateWarehouse(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteWarehouse(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await warehouseService.deleteWarehouse(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Actions - Dropdown
  async function fetchDropdown() {
    try {
      const response = await warehouseService.getDropdown()
      const data = response.data
      if (data.status) {
        dropdown.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching warehouse dropdown:', e)
    }
  }

  async function fetchWarehouseCategoriesDropdown() {
    try {
      const response = await warehouseService.getWarehouseCategoriesDropdown()
      const data = response.data
      if (data.status) {
        warehouseCategories.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching warehouse categories:', e)
    }
  }

  return {
    // State
    warehouses,
    warehouseCategories,
    dropdown,
    meta,
    loading,
    error,

    // Actions
    fetchWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    fetchWarehouseCategoriesDropdown,
    fetchDropdown
  }
})