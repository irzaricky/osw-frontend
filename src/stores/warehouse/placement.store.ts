import { defineStore } from 'pinia'
import { ref } from 'vue'
import placementService, {
  type PlacementParams,
  type ValidateLabelPayload,
  type PlaceBinPayload
} from '../../services/warehouse/placement.service'

export const usePlacementStore = defineStore('placement', () => {
  const placements = ref<any[]>([])
  const placementDetail = ref<any | null>(null)
  const availableBins = ref<any[]>([])
  const scannedLabel = ref<any | null>(null)
  const workOrderTypes = ref<any[]>([])

  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPlacements(params: PlacementParams = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await placementService.getPlacements(params)
      const data = response.data

      if (data.status) {
        placements.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }

      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching placements:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchPlacementDetail(id: number | string) {
    loading.value = true
    error.value = null

    try {
      const response = await placementService.getPlacementDetail(id)
      const data = response.data

      if (data.status) {
        placementDetail.value = data.data
      }

      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching placement detail:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function validateLabel(id: number | string, payload: ValidateLabelPayload) {
    loading.value = true
    error.value = null

    try {
      const response = await placementService.validateLabel(id, payload)
      const data = response.data

      if (data.status) {
        scannedLabel.value = data.data
      }

      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchAvailableBins(id: number | string, params: Record<string, any> = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await placementService.getAvailableBins(id, params)
      const data = response.data

      if (data.status) {
        availableBins.value = data.data
      }

      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching available bins:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function placeBin(id: number | string, payload: PlaceBinPayload) {
    loading.value = true
    error.value = null

    try {
      const response = await placementService.placeBin(id, payload)
      const data = response.data

      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchWorkOrderTypes() {
    try {
      const response = await placementService.getWorkOrderTypes()
      const data = response.data

      if (data.status) {
        workOrderTypes.value = data.data
      }

      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    }
  }

  function resetScanState() {
    scannedLabel.value = null
    availableBins.value = []
  }

  return {
    placements,
    placementDetail,
    availableBins,
    scannedLabel,
    workOrderTypes,
    meta,
    loading,
    error,

    fetchPlacements,
    fetchPlacementDetail,
    validateLabel,
    fetchAvailableBins,
    placeBin,
    fetchWorkOrderTypes,
    resetScanState
  }
})