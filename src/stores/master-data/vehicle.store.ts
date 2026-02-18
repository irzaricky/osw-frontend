import { defineStore } from 'pinia'
import { ref } from 'vue'
import vehicleService, { type VehicleParams } from '../../services/master-data/vehicle.service'
import type { Vehicle, VehicleType } from '../../types/master-data/vehicle'

export const useVehicleStore = defineStore('vehicle', () => {
  // State
  const vehicles = ref<Vehicle[]>([])
  const vehicleTypes = ref<VehicleType[]>([])
  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions - Vehicles
  async function fetchVehicles(params: VehicleParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await vehicleService.getVehicles(params)
      const data = response.data
      if (data.status) {
        vehicles.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching vehicles:', e)
    } finally {
      loading.value = false
    }
  }

  async function createVehicle(formData: FormData) {
    loading.value = true
    error.value = null
    try {
      const response = await vehicleService.addVehicle(formData)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateVehicle(id: number | string, formData: FormData) {
    loading.value = true
    error.value = null
    try {
      const response = await vehicleService.updateVehicle(id, formData)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteVehicle(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await vehicleService.deleteVehicle(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function downloadVehicles(params: VehicleParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await vehicleService.downloadVehicles(params)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Actions - Vehicle Types
  async function fetchVehicleTypes() {
    loading.value = true
    error.value = null
    try {
      const response = await vehicleService.getVehicleTypesDropdown()
      const data = response.data
      if (data.status) {
        vehicleTypes.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching vehicle types:', e)
    } finally {
      loading.value = false
    }
  }

  async function createVehicleType(data: Partial<VehicleType>) {
    loading.value = true
    error.value = null
    try {
      const response = await vehicleService.addVehicleType(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateVehicleType(id: number | string, data: Partial<VehicleType>) {
    loading.value = true
    error.value = null
    try {
      const response = await vehicleService.updateVehicleType(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteVehicleType(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await vehicleService.deleteVehicleType(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    vehicles,
    vehicleTypes,
    meta,
    loading,
    error,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    downloadVehicles,
    fetchVehicleTypes,
    createVehicleType,
    updateVehicleType,
    deleteVehicleType
  }
})
