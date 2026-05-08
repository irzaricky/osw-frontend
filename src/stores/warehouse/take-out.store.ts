import { defineStore } from 'pinia'
import { ref } from 'vue'
import takeOutService, {
  type TakeOutParams,
  type ScanLabelOutPayload
} from '../../services/warehouse/take-out.service'
import type {
  TakeOut,
  TakeOutDetail,
  TakeOutRecommendation
} from '../../types/warehouse/take-out'

export const useTakeOutStore = defineStore('take-out', () => {
  const takeOuts = ref<TakeOut[]>([])
  const takeOutDetail = ref<TakeOutDetail | null>(null)
  const recommendations = ref<TakeOutRecommendation[]>([])
  const workOrderTypes = ref<any[]>([])

  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTakeOuts(params: TakeOutParams = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await takeOutService.getTakeOuts(params)
      const data = response.data

      if (data.status) {
        takeOuts.value = data.data.rows
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
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchWorkOrderTypes() {
    try {
      const response = await takeOutService.getWorkOrderTypes()
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

  async function fetchTakeOutDetail(id: number | string) {
    loading.value = true
    error.value = null

    try {
      const response = await takeOutService.getTakeOutDetail(id)
      const data = response.data

      if (data.status) {
        takeOutDetail.value = data.data
      }

      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchRecommendations(id: number | string) {
    loading.value = true
    error.value = null

    try {
      const response = await takeOutService.getRecommendations(id)
      const data = response.data

      if (data.status) {
        recommendations.value = data.data
      }

      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function scanLabelOut(id: number | string, payload: ScanLabelOutPayload) {
    loading.value = true
    error.value = null

    try {
      const response = await takeOutService.scanLabelOut(id, payload)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  function resetTakeOutState() {
    takeOutDetail.value = null
    recommendations.value = []
  }

  return {
    takeOuts,
    takeOutDetail,
    recommendations,
    workOrderTypes,
    meta,
    loading,
    error,

    fetchTakeOuts,
    fetchTakeOutDetail,
    fetchRecommendations,
    fetchWorkOrderTypes,
    scanLabelOut,
    resetTakeOutState
  }
})