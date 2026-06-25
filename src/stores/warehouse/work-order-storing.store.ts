import { defineStore } from 'pinia'
import { ref } from 'vue'
import workOrderStoringService, { type WorkOrderStoringParams } from '../../services/warehouse/work-order-storing.service'
import type { WorkOrderStoring, WorkOrderStoringType, WorkOrderStoringStatus, StationDropdown, ProductionWODropdown } from '../../types/warehouse/work-order-storing'

export const useWorkOrderStoringStore = defineStore('work-order-storing', () => {
  // State
  const workOrders = ref<WorkOrderStoring[]>([])
  const workOrderTypes = ref<WorkOrderStoringType[]>([])
  const workOrderStatuses = ref<WorkOrderStoringStatus[]>([])
  const productionWOs = ref<ProductionWODropdown[]>([])
  const stations = ref<StationDropdown[]>([])

  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions - Work Order Storing
  async function fetchWorkOrders(params: WorkOrderStoringParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await workOrderStoringService.getWorkOrders(params)
      const data = response.data
      if (data.status) {
        workOrders.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching work orders:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchWorkOrder(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await workOrderStoringService.getWorkOrder(id)
      const data = response.data
      return data.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching work order:', e)
    } finally {
      loading.value = false
    }
  }

  async function createWorkOrder(data: Partial<WorkOrderStoring>) {
    loading.value = true
    error.value = null
    try {
      const response = await workOrderStoringService.createWorkOrder(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateWorkOrder(id: number | string, data: Partial<WorkOrderStoring>) {
    loading.value = true
    error.value = null
    try {
      const response = await workOrderStoringService.updateWorkOrder(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteWorkOrder(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await workOrderStoringService.deleteWorkOrder(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function printLabel(wo_item_id: number | string) {
    try {
      const response = await workOrderStoringService.printLabel(wo_item_id)

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)

      window.open(url, '_blank')
      
      return { url }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error printing label:', e)
      throw e
    }
  }

  // Actions - Dropdown
  async function fetchWorkOrderTypesDropdown() {
    try {
      const response = await workOrderStoringService.getTypesDropdown()
      const data = response.data
      if (data.status) {
        workOrderTypes.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching work order types:', e)
    }
  }

  async function fetchWorkOrderStatusesDropdown() {
    try {
      const response = await workOrderStoringService.getStatusesDropdown()
      const data = response.data
      if (data.status) {
        workOrderStatuses.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching work order statuses:', e)
    }
  }

  async function fetchWoProductionDropdown() {
    try {
      const response = await workOrderStoringService.getWoProductionDropdown()
      const data = response.data
      if (data.status) {
        productionWOs.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching wo production:', e)
    }
  }

  async function fetchStationDropdown(params?: Record<string, any>) {
    try {
      const response = await workOrderStoringService.getStationDropdown(params)
      const data = response.data
      if (data.status) {
        stations.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching buffer station:', e)
    }
  }

  return {
    // State
    workOrders,
    workOrderTypes,
    workOrderStatuses,
    productionWOs,
    stations,
    meta,
    loading,
    error,

    // Actions
    fetchWorkOrders,
    fetchWorkOrder,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    printLabel,
    fetchWorkOrderTypesDropdown,
    fetchWorkOrderStatusesDropdown,
    fetchWoProductionDropdown,
    fetchStationDropdown
  }
})