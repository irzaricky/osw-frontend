import { defineStore } from 'pinia'
import { ref } from 'vue'
import productionAnalyticsService from '../../services/production-plan/analytics.service'
import type {
  AnalyticsParams,
  ExecutiveSummary,
  ProductionTrendItem,
  LineUtilizationItem,
  WorkOrderStatusItem,
  OutputQualityItem,
  DowntimeByTypeItem,
  TopDowntimeStationItem,
  DefectByTypeItem,
  LineEfficiencyItem,
  OnTimeDelivery,
  RescheduleFrequencyItem,
  CapacityFeasibilityItem,
  IssueDetail,
  PaginationMeta
} from '../../types/production-plan/analytics'

export const useProductionAnalyticsStore = defineStore('production-analytics', () => {
  // State
  const executiveSummary = ref<Partial<ExecutiveSummary>>({})
  const productionTrend = ref<ProductionTrendItem[]>([])
  const lineUtilization = ref<LineUtilizationItem[]>([])
  const workOrderStatus = ref<WorkOrderStatusItem[]>([])
  const outputQuality = ref<OutputQualityItem[]>([])
  const downtimeByType = ref<DowntimeByTypeItem[]>([])
  const topDowntimeStations = ref<TopDowntimeStationItem[]>([])
  const defectByType = ref<DefectByTypeItem[]>([])
  const lineEfficiency = ref<LineEfficiencyItem[]>([])
  const onTimeDelivery = ref<OnTimeDelivery>({ on_time: 0, late: 0, not_completed: 0 })
  const rescheduleFrequency = ref<RescheduleFrequencyItem[]>([])
  const capacityFeasibility = ref<CapacityFeasibilityItem[]>([])
  const issueDetails = ref<IssueDetail[]>([])
  const issueMeta = ref<PaginationMeta>({ page: 1, limit: 5, total: 0, total_pages: 0 })

  const loading = ref({
    summary: false,
    trend: false,
    utilization: false,
    woStatus: false,
    quality: false,
    downtime: false,
    stations: false,
    defect: false,
    efficiency: false,
    delivery: false,
    reschedule: false,
    capacity: false,
    issues: false
  })
  const error = ref<string | null>(null)

  // Actions
  async function fetchExecutiveSummary(params: AnalyticsParams = {}) {
    loading.value.summary = true
    error.value = null
    try {
      const response = await productionAnalyticsService.getExecutiveSummary(params)
      const data = response.data
      if (data.status) {
        executiveSummary.value = data.data || {}
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching executive summary:', e)
    } finally {
      loading.value.summary = false
    }
  }

  async function fetchProductionTrend(params: AnalyticsParams = {}) {
    loading.value.trend = true
    error.value = null
    try {
      const response = await productionAnalyticsService.getProductionTrend(params)
      const data = response.data
      if (data.status) {
        productionTrend.value = data.data || []
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching production trend:', e)
    } finally {
      loading.value.trend = false
    }
  }

  async function fetchLineUtilization(params: AnalyticsParams = {}) {
    loading.value.utilization = true
    error.value = null
    try {
      const response = await productionAnalyticsService.getLineUtilization(params)
      const data = response.data
      if (data.status) {
        lineUtilization.value = data.data || []
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching line utilization:', e)
    } finally {
      loading.value.utilization = false
    }
  }

  async function fetchWorkOrderStatus(params: AnalyticsParams = {}) {
    loading.value.woStatus = true
    error.value = null
    try {
      const response = await productionAnalyticsService.getWorkOrderStatus(params)
      const data = response.data
      if (data.status) {
        workOrderStatus.value = data.data || []
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching work order status:', e)
    } finally {
      loading.value.woStatus = false
    }
  }

  async function fetchOutputQuality(params: AnalyticsParams = {}) {
    loading.value.quality = true
    error.value = null
    try {
      const response = await productionAnalyticsService.getOutputQuality(params)
      const data = response.data
      if (data.status) {
        outputQuality.value = data.data || []
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching output quality:', e)
    } finally {
      loading.value.quality = false
    }
  }

  async function fetchDowntimeByType(params: AnalyticsParams = {}) {
    loading.value.downtime = true
    error.value = null
    try {
      const response = await productionAnalyticsService.getDowntimeByType(params)
      const data = response.data
      if (data.status) {
        downtimeByType.value = data.data || []
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching downtime by type:', e)
    } finally {
      loading.value.downtime = false
    }
  }

  async function fetchTopDowntimeStations(params: AnalyticsParams = {}) {
    loading.value.stations = true
    error.value = null
    try {
      const response = await productionAnalyticsService.getTopDowntimeStations(params)
      const data = response.data
      if (data.status) {
        topDowntimeStations.value = data.data || []
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching top downtime stations:', e)
    } finally {
      loading.value.stations = false
    }
  }

  async function fetchDefectByType(params: AnalyticsParams = {}) {
    loading.value.defect = true
    error.value = null
    try {
      const response = await productionAnalyticsService.getDefectByType(params)
      const data = response.data
      if (data.status) {
        defectByType.value = data.data || []
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching defect by type:', e)
    } finally {
      loading.value.defect = false
    }
  }

  async function fetchLineEfficiency(params: AnalyticsParams = {}) {
    loading.value.efficiency = true
    error.value = null
    try {
      const response = await productionAnalyticsService.getLineEfficiency(params)
      const data = response.data
      if (data.status) {
        lineEfficiency.value = data.data || []
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching line efficiency:', e)
    } finally {
      loading.value.efficiency = false
    }
  }

  async function fetchOnTimeDelivery(params: AnalyticsParams = {}) {
    loading.value.delivery = true
    error.value = null
    try {
      const response = await productionAnalyticsService.getOnTimeDelivery(params)
      const data = response.data
      if (data.status) {
        onTimeDelivery.value = data.data || { on_time: 0, late: 0, not_completed: 0 }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching on-time delivery:', e)
    } finally {
      loading.value.delivery = false
    }
  }

  async function fetchRescheduleFrequency(params: AnalyticsParams = {}) {
    loading.value.reschedule = true
    error.value = null
    try {
      const response = await productionAnalyticsService.getRescheduleFrequency(params)
      const data = response.data
      if (data.status) {
        rescheduleFrequency.value = data.data || []
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching reschedule frequency:', e)
    } finally {
      loading.value.reschedule = false
    }
  }

  async function fetchCapacityFeasibility(params: AnalyticsParams = {}) {
    loading.value.capacity = true
    error.value = null
    try {
      const response = await productionAnalyticsService.getCapacityFeasibility(params)
      const data = response.data
      if (data.status) {
        capacityFeasibility.value = data.data || []
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching capacity feasibility:', e)
    } finally {
      loading.value.capacity = false
    }
  }

  async function fetchIssueDetails(params: AnalyticsParams = {}) {
    loading.value.issues = true
    error.value = null
    try {
      const response = await productionAnalyticsService.getIssueDetails({
        ...params,
        page: params.page || issueMeta.value.page,
        limit: params.limit || issueMeta.value.limit
      })
      const data = response.data
      if (data.status) {
        issueDetails.value = data.data || []
        issueMeta.value = {
          page: data.pagination?.page || 1,
          limit: data.pagination?.limit || 5,
          total: data.pagination?.total || 0,
          total_pages: data.pagination?.total_pages || 0
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching issue details:', e)
    } finally {
      loading.value.issues = false
    }
  }

  // Fetch every analytics slice for the given filter set in parallel
  async function fetchAll(params: AnalyticsParams = {}) {
    await Promise.all([
      fetchExecutiveSummary(params),
      fetchProductionTrend(params),
      fetchLineUtilization(params),
      fetchWorkOrderStatus(params),
      fetchOutputQuality(params),
      fetchDowntimeByType(params),
      fetchTopDowntimeStations(params),
      fetchDefectByType(params),
      fetchLineEfficiency(params),
      fetchOnTimeDelivery(params),
      fetchRescheduleFrequency(params),
      fetchCapacityFeasibility(params),
      fetchIssueDetails({ ...params, page: 1 })
    ])
  }

  return {
    executiveSummary,
    productionTrend,
    lineUtilization,
    workOrderStatus,
    outputQuality,
    downtimeByType,
    topDowntimeStations,
    defectByType,
    lineEfficiency,
    onTimeDelivery,
    rescheduleFrequency,
    capacityFeasibility,
    issueDetails,
    issueMeta,
    loading,
    error,
    fetchExecutiveSummary,
    fetchProductionTrend,
    fetchLineUtilization,
    fetchWorkOrderStatus,
    fetchOutputQuality,
    fetchDowntimeByType,
    fetchTopDowntimeStations,
    fetchDefectByType,
    fetchLineEfficiency,
    fetchOnTimeDelivery,
    fetchRescheduleFrequency,
    fetchCapacityFeasibility,
    fetchIssueDetails,
    fetchAll
  }
})