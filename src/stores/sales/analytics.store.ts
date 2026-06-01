/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import analyticsService from '../../services/sales/analytics.service'
import type { AnalyticsFilters, AnalyticsSummary } from '../../types/sales/analytics'

interface SlaMetrics {
  on_time: number
  delayed: number
  total: number
  on_time_rate: number
}

interface ForecastVsSpoItem {
  month: string
  forecast_target: number
  spo_actual: number
}

interface TopCustomerItem {
  customer_id: number
  customer_name: string
  total_ordered_qty: number
}

export interface ForecastAnalyticsKPIs {
  total_volume: number
  active_versions: number
  accuracy_rate: number
}

export interface ForecastAnalyticsTrendItem {
  month: string
  temporary_qty: number
  fix_qty: number
}

export interface ForecastAnalyticsProductItem {
  part_id: number
  part_number: string
  part_name: string
  total_qty: number
}

export interface ForecastAnalyticsData {
  date_range: {
    start: string
    end: string
  }
  kpis: ForecastAnalyticsKPIs
  trends: ForecastAnalyticsTrendItem[]
  top_products: ForecastAnalyticsProductItem[]
}

export interface SprAnalyticsKPIs {
  active_sprs: number
  avg_approval_time: number
  rejection_rate: number
}

export interface SprAnalyticsStatusBreakdown {
  Draft: number
  Submitted: number
  Approved: number
  Rejected: number
}

export interface SprAnalyticsFunnelItem {
  stage: string
  count: number
}

export interface SprAnalyticsData {
  date_range: {
    start: string
    end: string
  }
  kpis: SprAnalyticsKPIs
  status_breakdown: SprAnalyticsStatusBreakdown
  pipeline_funnel: SprAnalyticsFunnelItem[]
}

export interface SpoAnalyticsKPIs {
  total_ordered_items: number
  fulfillment_rate: number
  active_customers: number
}

export interface SpoAnalyticsStatusBreakdown {
  Draft: number
  Submitted: number
  Locked: number
  Processing: number
  Completed: number
  Rejected: number
}

export interface SpoAnalyticsCustomerItem {
  customer_id: number
  customer_name: string
  total_ordered_qty: number
}

export interface SpoAnalyticsTrendItem {
  month: string
  ordered_qty: number
  sent_qty: number
}

export interface SpoAnalyticsData {
  date_range: {
    start: string
    end: string
  }
  kpis: SpoAnalyticsKPIs
  status_breakdown: SpoAnalyticsStatusBreakdown
  top_customers: SpoAnalyticsCustomerItem[]
  monthly_trends: SpoAnalyticsTrendItem[]
}

export interface SdoAnalyticsKPIs {
  total_spos: number
  total_ordered_qty: number
  total_sent_qty: number
  on_time: number
  delayed: number
  on_time_rate: number
}

export interface SdoAnalyticsStatusCounts {
  Created: number
  Loading: number
  'In Transit': number
  Delivered: number
}

export interface SdoAnalyticsData {
  date_range: {
    start: string
    end: string
  }
  kpis: SdoAnalyticsKPIs
  sdo_status_counts: SdoAnalyticsStatusCounts
  forecast_vs_spo: ForecastVsSpoItem[]
  top_customers: TopCustomerItem[]
}

export const useSalesAnalyticsStore = defineStore('salesAnalytics', () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const summary = ref<AnalyticsSummary | null>(null)
  const trends = ref<any[]>([])
  const slaMetrics = ref<SlaMetrics | null>(null)
  const forecastVsSpo = ref<ForecastVsSpoItem[]>([])
  const topCustomers = ref<TopCustomerItem[]>([])
  const forecastAnalytics = ref<ForecastAnalyticsData | null>(null)
  const sprAnalytics = ref<SprAnalyticsData | null>(null)
  const spoAnalytics = ref<SpoAnalyticsData | null>(null)
  const sdoAnalytics = ref<SdoAnalyticsData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const filters = ref<AnalyticsFilters>({
    start_date: '',
    end_date: ''
  })

  // ─── Actions ─────────────────────────────────────────────────────────────────
  async function fetchSummary(params: AnalyticsFilters = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await analyticsService.getSummary(params)
      const data = response.data
      if (data.status) {
        summary.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching analytics summary:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchTrends(params: AnalyticsFilters = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await analyticsService.getTrends(params)
      const data = response.data
      if (data.status) {
        trends.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching analytics trends:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchSlaMetrics(params: AnalyticsFilters = {}) {
    try {
      const response = await analyticsService.getSlaMetrics(params)
      if (response.data.status) {
        slaMetrics.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching SLA metrics:', e)
    }
  }

  async function fetchForecastVsSpo(params: AnalyticsFilters = {}) {
    try {
      const response = await analyticsService.getForecastVsSpo(params)
      if (response.data.status) {
        forecastVsSpo.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching forecast vs SPO:', e)
    }
  }

  async function fetchTopCustomers(params: AnalyticsFilters = {}) {
    try {
      const response = await analyticsService.getTopCustomers(params)
      if (response.data.status) {
        topCustomers.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching top customers:', e)
    }
  }

  async function fetchForecastAnalytics(params: AnalyticsFilters = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await analyticsService.getForecastAnalytics(params)
      const data = response.data
      if (data.status) {
        forecastAnalytics.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching forecast analytics:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchSprAnalytics(params: AnalyticsFilters = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await analyticsService.getSprAnalytics(params)
      const data = response.data
      if (data.status) {
        sprAnalytics.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching SPR analytics:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchSpoAnalytics(params: AnalyticsFilters = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await analyticsService.getSpoAnalytics(params)
      const data = response.data
      if (data.status) {
        spoAnalytics.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching SPO analytics:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchSdoAnalytics(params: AnalyticsFilters = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await analyticsService.getSdoAnalytics(params)
      const data = response.data
      if (data.status) {
        sdoAnalytics.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching SDO analytics:', e)
    } finally {
      loading.value = false
    }
  }

  async function downloadExcel(params: AnalyticsFilters = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await analyticsService.exportExcel(params)
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)

      const start = params.start_date || 'report'
      const end = params.end_date || 'report'
      link.download = `Laporan_Pengiriman_SDO_${start}_${end}.xlsx`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error exporting SDO excel:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    summary,
    trends,
    slaMetrics,
    forecastVsSpo,
    topCustomers,
    forecastAnalytics,
    sprAnalytics,
    spoAnalytics,
    sdoAnalytics,
    loading,
    error,
    filters,
    // Actions
    fetchSummary,
    fetchTrends,
    fetchSlaMetrics,
    fetchForecastVsSpo,
    fetchTopCustomers,
    fetchForecastAnalytics,
    fetchSprAnalytics,
    fetchSpoAnalytics,
    fetchSdoAnalytics,
    downloadExcel
  }
})
