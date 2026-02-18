import { api } from '../../plugins/axios'
import type { Vehicle, VehicleType } from '../../types/master-data/vehicle'

export interface VehicleParams {
  page?: number
  limit?: number
  search?: string
  vehicle_type_id?: number
  active?: boolean | string
  [key: string]: any
}

const vehicleService = {
  // Vehicle Types
  getVehicleTypesDropdown() {
    return api.get('/master-data/vehicles/dd-vehicle-types')
  },

  addVehicleType(data: Partial<VehicleType>) {
    return api.post('/master-data/vehicles/types', data)
  },

  updateVehicleType(id: number | string, data: Partial<VehicleType>) {
    return api.put(`/master-data/vehicles/types/${id}`, data)
  },

  deleteVehicleType(id: number | string) {
    return api.delete(`/master-data/vehicles/types/${id}`)
  },

  // Vehicles
  getVehicles(params?: VehicleParams) {
    return api.get('/master-data/vehicles/', { params })
  },

  getVehicleById(id: number | string) {
    return api.get(`/master-data/vehicles/${id}`)
  },

  addVehicle(data: FormData) {
    return api.post('/master-data/vehicles/', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  updateVehicle(id: number | string, data: FormData) {
    return api.put(`/master-data/vehicles/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  deleteVehicle(id: number | string) {
    return api.delete(`/master-data/vehicles/${id}`)
  },

  downloadVehicles(params?: VehicleParams) {
    return api.get('/master-data/vehicles/download', { params, responseType: 'blob' })
  }
}

export default vehicleService
