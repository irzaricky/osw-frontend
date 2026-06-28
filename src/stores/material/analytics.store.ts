// stores/material/analytics.store.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import materialAnalyticsService from '../../services/material/analytics.service'
import type {
  MrpAnalytics,
  MprAnalytics,
  MpoAnalytics,
  MdoAnalytics,
  MaterialAnalyticsParams
} from '../../types/material/analytics'

export const useMaterialAnalyticsStore = defineStore('materialAnalytics', () => {
  // ─── Filters (dipakai bersama oleh semua tab, sama seperti pola Sales Analytics) ──
  const filters = ref<MaterialAnalyticsParams>({
    start_date: '',
    end_date: ''
  })

  // ─── State per tab ──────────────────────────────────────────────────────────
  const mrpAnalytics = ref<MrpAnalytics | null>(null)
  const mprAnalytics = ref<MprAnalytics | null>(null)
  const mpoAnalytics = ref<MpoAnalytics | null>(null)
  const mdoAnalytics = ref<MdoAnalytics | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Actions ────────────────────────────────────────────────────────────────
  async function fetchMrpAnalytics(params: MaterialAnalyticsParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await materialAnalyticsService.getMrpAnalytics(params)
      const data = response.data
      if (data.status) mrpAnalytics.value = data.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching MRP analytics:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchMprAnalytics(params: MaterialAnalyticsParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await materialAnalyticsService.getMprAnalytics(params)
      const data = response.data
      if (data.status) mprAnalytics.value = data.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching MPR analytics:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchMpoAnalytics(params: MaterialAnalyticsParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await materialAnalyticsService.getMpoAnalytics(params)
      const data = response.data
      if (data.status) mpoAnalytics.value = data.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching MPO analytics:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchMdoAnalytics(params: MaterialAnalyticsParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await materialAnalyticsService.getMdoAnalytics(params)
      const data = response.data
      if (data.status) mdoAnalytics.value = data.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching MDO analytics:', e)
    } finally {
      loading.value = false
    }
  }

  return {
    // Filters
    filters,
    // State
    mrpAnalytics,
    mprAnalytics,
    mpoAnalytics,
    mdoAnalytics,
    loading,
    error,
    // Actions
    fetchMrpAnalytics,
    fetchMprAnalytics,
    fetchMpoAnalytics,
    fetchMdoAnalytics
  }
})