import { defineStore } from 'pinia'
import { ref } from 'vue'
import forecastService, { type ForecastParams } from '../../services/sales/forecast.service'
import type { Forecast } from '../../types/sales/forecast'

export const useForecastStore = defineStore('forecast', () => {
  // State
  const forecasts = ref<Forecast[]>([])
  const detail = ref<Forecast | null>(null)
  
  // Dropdowns
  const customersDropdown = ref<{ id: number; customer_code: string; name: string }[]>([])
  const forecastTypesDropdown = ref<string[]>([])
  const statusDropdown = ref<string[]>([])
  const partsDropdown = ref<{ id: number; part_number: string; part_name: string }[]>([])

  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchForecasts(params: ForecastParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await forecastService.getForecasts(params)
      const data = response.data
      if (data.status) {
        forecasts.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching forecasts:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchForecastById(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await forecastService.getForecastById(id)
      const data = response.data
      if (data.status) {
        detail.value = data.data
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchDropdownCustomers(params?: Record<string, any>) {
    try {
      const response = await forecastService.ddCustomers(params)
      if (response.data?.status) {
        customersDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching customers dropdown:', e)
    }
  }

  async function fetchDropdownForecastTypes(params?: Record<string, any>) {
    try {
      const response = await forecastService.ddForecastTypes(params)
      if (response.data?.status) {
        forecastTypesDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching forecast types dropdown:', e)
    }
  }

  async function fetchDropdownStatus(params?: Record<string, any>) {
    try {
      const response = await forecastService.ddStatus(params)
      if (response.data?.status) {
        statusDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching status dropdown:', e)
    }
  }

  async function fetchDropdownParts(params?: Record<string, any>) {
    try {
      const response = await forecastService.ddParts(params)
      if (response.data?.status) {
        partsDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching parts dropdown:', e)
    }
  }

  async function createForecast(data: Partial<Forecast>) {
    loading.value = true
    error.value = null
    try {
      const response = await forecastService.createForecast(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateForecast(id: number | string, data: Partial<Forecast>) {
    loading.value = true
    error.value = null
    try {
      const response = await forecastService.updateForecast(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateForecastDetail(id: number | string, data: any) {
    loading.value = true
    error.value = null
    try {
      const response = await forecastService.updateForecastDetail(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteForecast(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await forecastService.deleteForecast(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function submitForecast(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await forecastService.submitForecast(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function reviewForecast(id: number | string, data: { status: string; remarks?: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await forecastService.reviewForecast(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function downloadTemplateDetail(forecastType: string) {
    loading.value = true
    error.value = null
    try {
      const response = await forecastService.downloadTemplateDetail(forecastType)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function uploadTemplateDetail(file: File, forecastType: string) {
    loading.value = true
    error.value = null
    try {
      const response = await forecastService.uploadTemplateDetail(file, forecastType)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    forecasts,
    detail,
    customersDropdown,
    forecastTypesDropdown,
    statusDropdown,
    partsDropdown,
    meta,
    loading,
    error,
    fetchForecasts,
    fetchForecastById,
    fetchDropdownCustomers,
    fetchDropdownForecastTypes,
    fetchDropdownStatus,
    fetchDropdownParts,
    createForecast,
    updateForecast,
    updateForecastDetail,
    deleteForecast,
    submitForecast,
    reviewForecast,
    downloadTemplateDetail,
    uploadTemplateDetail
  }
})
