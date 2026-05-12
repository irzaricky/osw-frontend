import { defineStore } from 'pinia'
import { ref } from 'vue'
import warehouseLayoutService, { type WarehouseLayoutParams, type StorageBinDetailParams } from '../../services/warehouse/warehouse-layout.service'
import type { WarehouseLayout, WarehouseLayoutDetail, AreaLayout, AreaLayoutPayload, StorageBinDetail } from '../../types/warehouse/warehouse-layout'

export const useWarehouseLayoutStore = defineStore('warehouse-layout', () => {
  // State
  const layouts = ref<WarehouseLayout[]>([])
  const layoutDetail = ref<WarehouseLayoutDetail | null>(null)
  const areaLayoutDetail = ref<AreaLayout | null>(null)
  const storageBinDetail = ref<StorageBinDetail | null>(null)

  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const storageBinMeta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions - Warehouse Layout
  async function fetchLayouts(params: WarehouseLayoutParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await warehouseLayoutService.getLayouts(params)
      const data = response.data
      if (data.status) {
        layouts.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching warehouse layouts:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchLayout(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await warehouseLayoutService.getLayout(id)
      const data = response.data
      layoutDetail.value = data.data
      return data.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching warehouse layout detail:', e)
    } finally {
      loading.value = false
    }
  }

  async function createLayout(data: { warehouse_id: number }) {
    loading.value = true
    error.value = null
    try {
      const response = await warehouseLayoutService.createLayout(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Actions - Area Layout
  async function fetchAreaLayout(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await warehouseLayoutService.getAreaLayout(id)
      const data = response.data
      areaLayoutDetail.value = data.data
      return data.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching area layout detail:', e)
    } finally {
      loading.value = false
    }
  }

  async function addAreaLayout(layoutId: number | string, data: Partial<AreaLayoutPayload>) {
    loading.value = true
    error.value = null
    try {
      const response = await warehouseLayoutService.addAreaLayout(layoutId, data)
      await fetchLayout(layoutId)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateAreaLayout(id: number | string, layoutId: number | string, data: Partial<AreaLayoutPayload>) {
    loading.value = true
    error.value = null
    try {
      const response = await warehouseLayoutService.updateAreaLayout(id, data)
      await fetchLayout(layoutId)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteAreaLayout(id: number | string, layoutId: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await warehouseLayoutService.deleteAreaLayout(id)
      await fetchLayout(layoutId)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Actions - Storage Bin Detail
  async function fetchStorageBinDetail(id: number | string, params: StorageBinDetailParams = {}) {
    storageBinDetail.value = null
    loading.value = true
    error.value = null
    try {
      const response = await warehouseLayoutService.getStorageBinDetail(id, params)
      const data = response.data
      if (data.status) {
        storageBinDetail.value = data.data
        storageBinMeta.value = {
          page: data.data.stocks.page,
          limit: data.data.stocks.limit,
          total: data.data.stocks.count,
          totalPages: data.data.stocks.totalPages
        }
      }
      return data.data
    }
    catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching storage bin detail:', e)
    }
    finally {
      loading.value = false
    }
  }

  return {
    // State
    layouts,
    layoutDetail,
    areaLayoutDetail,
    storageBinDetail,
    meta,
    storageBinMeta,
    loading,
    error,

    // Actions
    fetchLayouts,
    fetchLayout,
    createLayout,
    fetchAreaLayout,
    addAreaLayout,
    updateAreaLayout,
    deleteAreaLayout,
    fetchStorageBinDetail
  }
})