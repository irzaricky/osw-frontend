/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import analyticsService from '../../services/sales/analytics.service'
import type { AnalyticsFilters, AnalyticsSummary } from '../../types/sales/analytics'

export const useSalesAnalyticsStore = defineStore('salesAnalytics', () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const summary = ref<AnalyticsSummary | null>(null)
  const trends = ref<any[]>([])
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
    loading,
    error,
    filters,
    // Actions
    fetchSummary,
    downloadExcel
  }
})
