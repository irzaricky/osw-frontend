import { defineStore } from 'pinia'
import { ref } from 'vue'
import stationService, { type StationParams } from '../../services/master-data/station.service'
import type { Station, StationJob, StationType } from '../../types/master-data/station'

export const useStationStore = defineStore('station', () => {
  // State 
  const stations = ref<Station[]>([])
  const dropdown = ref<Pick<Station, 'id' | 'name' | 'station_code'>[]>([])
  const stationTypes = ref<StationType[]>([])
  const stationJobs = ref<StationJob[]>([])
  const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const loading = ref(false)
  const loadingJobs = ref(false)
  const error = ref<string | null>(null)

  // Station Actions
  async function fetchStationTypes() {
    try {
      const { data } = await stationService.getStationTypes()
      if (data.status) stationTypes.value = data.data
    } catch (e: any) {
      console.error('[stationStore] fetchStationTypes:', e)
    }
  }

  async function fetchDropdown() {
    try {
      const { data } = await stationService.getDropdown()
      if (data.status) dropdown.value = data.data
    } catch (e: any) {
      console.error('[stationStore] fetchDropdown:', e)
    }
  }

  async function fetchStations(params: StationParams = {}) {
    loading.value = true
    error.value = null
    try {
      const { data } = await stationService.getStations(params)
      if (data.status) {
        stations.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages,
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
    } finally {
      loading.value = false
    }
  }

  async function createStation(payload: Partial<Station>) {
    loading.value = true
    error.value = null
    try {
      const { data } = await stationService.createStation(payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateStation(id: number | string, payload: Partial<Station>) {
    loading.value = true
    error.value = null
    try {
      const { data } = await stationService.updateStation(id, payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteStation(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await stationService.deleteStation(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function downloadStations(params: StationParams = {}) {
    loading.value = true
    error.value = null
    try {
      const { data } = await stationService.downloadStations(params)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function uploadStations(file: File) {
    loading.value = true
    error.value = null
    try {
      const { data } = await stationService.uploadStations(file)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Station Job Actions
  async function fetchStationJobs(stationId: number | string) {
    loadingJobs.value = true
    try {
      const { data } = await stationService.getStationJobs(stationId)
      if (data.status) stationJobs.value = data.data
    } catch (e: any) {
      console.error('[stationStore] fetchStationJobs:', e)
    } finally {
      loadingJobs.value = false
    }
  }

  async function addStationJob(stationId: number | string, payload: Partial<StationJob>) {
    loadingJobs.value = true
    try {
      const { data } = await stationService.addStationJob(stationId, payload)
      return data
    } catch (e: any) {
      throw e
    } finally {
      loadingJobs.value = false
    }
  }

  async function updateStationJob(
    stationId: number | string,
    id: number | string,
    payload: Partial<StationJob>
  ) {
    loadingJobs.value = true
    try {
      const { data } = await stationService.updateStationJob(stationId, id, payload)
      return data
    } catch (e: any) {
      throw e
    } finally {
      loadingJobs.value = false
    }
  }

  async function deleteStationJob(stationId: number | string, id: number | string) {
    loadingJobs.value = true
    try {
      const { data } = await stationService.deleteStationJob(stationId, id)
      return data
    } catch (e: any) {
      throw e
    } finally {
      loadingJobs.value = false
    }
  }

  return {
    // state
    stations, dropdown, stationTypes, stationJobs,
    meta, loading, loadingJobs, error,
    // station
    fetchStationTypes, fetchDropdown, fetchStations,
    createStation, updateStation, deleteStation,
    downloadStations, uploadStations,
    // station jobs
    fetchStationJobs, addStationJob, updateStationJob, deleteStationJob,
  }
})