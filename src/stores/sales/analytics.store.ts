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

export const useSalesAnalyticsStore = defineStore('salesAnalytics', () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const summary = ref<AnalyticsSummary | null>(null)
  const trends = ref<any[]>([])
  const slaMetrics = ref<SlaMetrics | null>(null)
  const forecastVsSpo = ref<ForecastVsSpoItem[]>([])
  const topCustomers = ref<TopCustomerItem[]>([])
  const forecastAnalytics = ref<ForecastAnalyticsData | null>(null)
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
    downloadExcel
  }
})
