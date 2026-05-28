import { defineStore } from 'pinia'
import { ref } from 'vue'
import materialReceivingService, { type MaterialReceivingParams } from '../../services/warehouse/material-receiving.service'
import type { MaterialReceiving, MaterialReceivingDropdown, MaterialReceivingStatus, MarkQualityDefectPayload } from '../../types/warehouse/material-receiving'

export const useMaterialReceivingStore = defineStore('material-receiving', () => {
  // State
  const materialReceivings = ref<MaterialReceiving[]>([])
  const dropdown = ref<MaterialReceivingDropdown[]>([])
  const materialReceivingStatuses = ref<MaterialReceivingStatus[]>([])

  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions - Material Receiving
  async function fetchMaterialReceivings(params: MaterialReceivingParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await materialReceivingService.getMaterialReceivings(params)
      const data = response.data
      if (data.status) {
        materialReceivings.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching material receivings:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchMaterialReceiving(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await materialReceivingService.getMaterialReceiving(id)
      const data = response.data
      return data.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching material receiving:', e)
    } finally {
      loading.value = false
    }
  }

  async function setArrived(id: number | string, payload?: { remarks?: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await materialReceivingService.setArrived(id, payload)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error confirming delivery:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchProgress(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await materialReceivingService.getProgress(id)
      const data = response.data
      return data.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching progress material receiving:', e)
    } finally {
      loading.value = false
    }
  }

  async function printLabel(mdo_detail_id: number | string, part_number: string) {
    try {
      const response = await materialReceivingService.printLabel(mdo_detail_id)

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
    
      const link = document.createElement('a')
      link.href = url
      link.download = `MDO-${part_number}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      return { url, fileName: link.download }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error printing label:', e)
      throw e
    }
  }

  // Actions - Quantity Checking
  async function fetchQuantityCheckingDetail(mdo_detail_id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await materialReceivingService.getQuantityCheckingDetail(mdo_detail_id)
      const data = response.data
      return data.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching quantity checking detail:', e)
    } finally {
      loading.value = false
    }
  }

  async function scanQuantityLabel(mr_item_id: number | string, payload: { label_number: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await materialReceivingService.scanQuantityLabel(mr_item_id, payload)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error scanning quantity label:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function markQuantityIncomplete(mr_item_label_id: number | string, payload: { actual_qty: number }) {
    loading.value = true
    error.value = null
    try {
      const response = await materialReceivingService.markQuantityIncomplete(mr_item_label_id, payload)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error marking quantity incomplete:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function submitQuantityChecking (mdo_detail_id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await materialReceivingService.submitQuantityChecking(mdo_detail_id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error submitting quantity checking:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // Actions - Quality Checking
  async function fetchQualityCheckingDetail(mdo_detail_id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await materialReceivingService.getQualityCheckingDetail(mdo_detail_id)
      const data = response.data
      return data.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching quality checking detail:', e)
    } finally {
      loading.value = false
    }
  }

  async function scanQualityLabel(mr_item_id: number | string, payload: { label_number: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await materialReceivingService.scanQualityLabel(mr_item_id, payload)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error scanning quality label:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function markQualityDefect(mr_item_label_id: number | string, payload: MarkQualityDefectPayload | FormData) {
    loading.value = true
    error.value = null
    try {
      const response = await materialReceivingService.markQualityDefect(mr_item_label_id, payload)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error marking quality defect:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function submitQualityChecking (mdo_detail_id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await materialReceivingService.submitQualityChecking(mdo_detail_id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error submitting quality checking:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // Actions - Dropdown
  async function fetchDropdown() {
    try {
      const response = await materialReceivingService.getDropdown()
      const data = response.data
      if (data.status) {
        dropdown.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching material receiving dropdown:', e)
    }
  }

  async function fetchMaterialReceivingStatusesDropdown() {
    try {
      const response = await materialReceivingService.getStatusesDropdown()
      const data = response.data
      if (data.status) {
        materialReceivingStatuses.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching material receiving statuses:', e)
    }
  }

  return {
    // State
    materialReceivings,
    dropdown,
    materialReceivingStatuses,
    meta,
    loading,
    error,

    // Actions
    fetchMaterialReceivings,
    fetchMaterialReceiving,
    setArrived,
    fetchProgress,
    printLabel,

    fetchQuantityCheckingDetail,
    scanQuantityLabel,
    markQuantityIncomplete,
    submitQuantityChecking,

    fetchQualityCheckingDetail,
    scanQualityLabel,
    markQualityDefect,
    submitQualityChecking,
    
    fetchDropdown,
    fetchMaterialReceivingStatusesDropdown
  }
})