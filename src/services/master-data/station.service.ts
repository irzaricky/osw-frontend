import { api } from '../../plugins/axios'
import type { Station, StationJob } from '../../types/master-data/station'

export interface StationParams {
  page?: number
  limit?: number
  search?: string
  line_id?: number
  station_type_id?: number
  status?: boolean
  [key: string]: any
}

const stationService = {
  // Ref
  getStationTypes() {
    return api.get('/master-data/stations/dd-station-type')
  },

  // Station
  getStations(params?: StationParams) {
    return api.get('/master-data/stations/', { params })
  },

  getDropdown() {
    return api.get('/master-data/stations/dropdown')
  },

  createStation(data: Partial<Station>) {
    return api.post('/master-data/stations/', data)
  },

  updateStation(id: number | string, data: Partial<Station>) {
    return api.put(`/master-data/stations/${id}`, data)
  },

  deleteStation(id: number | string) {
    return api.delete(`/master-data/stations/${id}`)
  },

  downloadStations(params?: StationParams) {
    return api.get('/master-data/stations/download', { params, responseType: 'blob' })
  },

  uploadStations(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/master-data/stations/upload', formData, {
      headers: { 'Content-Type': null }
    })
  },

  // Station Jobs
  getStationJobs(stationId: number | string) {
    return api.get(`/master-data/stations/${stationId}/jobs`)
  },

  addStationJob(stationId: number | string, data: Partial<StationJob>) {
    return api.post(`/master-data/stations/${stationId}/jobs`, data)
  },

  updateStationJob(stationId: number | string, id: number | string, data: Partial<StationJob>) {
    return api.put(`/master-data/stations/${stationId}/jobs/${id}`, data)
  },

  deleteStationJob(stationId: number | string, id: number | string) {
    return api.delete(`/master-data/stations/${stationId}/jobs/${id}`)
  }
}

export default stationService