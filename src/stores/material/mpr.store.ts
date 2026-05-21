import { defineStore } from 'pinia'
import { ref } from 'vue'
import mprService, { type MprParams } from '../../services/material/mpr.service'
import type { Mpr } from '../../types/material/mpr'

export const useMprStore = defineStore('mpr', () => {
  // State
  const mprs = ref<Mpr[]>([])
  const detail = ref<Mpr | null>(null)
  const logs = ref<any[]>([])

  // Dropdowns
  const partsDropdown = ref<{ value: number; label: string }[]>([])
  const statusDropdown = ref<{ value: string; label: string }[]>([])

  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async function fetchMprs(params: MprParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await mprService.getMprs(params)
      const data = response.data
      if (data.status) {
        mprs.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching MPRs:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchMprById(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await mprService.getMprById(id)
      const data = response.data
      if (data.status) {
        detail.value = data.data
        logs.value = data.data.logs || []
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchDropdownParts(params?: Record<string, any>) {
    try {
      const response = await mprService.ddParts(params)
      if (response.data?.status) {
        partsDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching parts dropdown:', e)
    }
  }

  async function fetchDropdownStatus() {
    try {
      const response = await mprService.ddStatus()
      if (response.data?.status) {
        statusDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching status dropdown:', e)
    }
  }

  async function createMpr(data: Record<string, any>) {
    loading.value = true
    error.value = null
    try {
      const response = await mprService.createMpr(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateMpr(id: number | string, data: Record<string, any>) {
    loading.value = true
    error.value = null
    try {
      const response = await mprService.updateMpr(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteMpr(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await mprService.deleteMpr(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function submitMpr(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await mprService.submitMpr(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function reviewMpr(id: number | string, data: { action: 'approve' | 'reject'; notes?: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await mprService.reviewMpr(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function bulkReviewMpr(data: { ids: number[]; action: 'approve' | 'reject'; notes?: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await mprService.bulkReviewMpr(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    mprs,
    detail,
    logs,
    partsDropdown,
    statusDropdown,
    meta,
    loading,
    error,
    fetchMprs,
    fetchMprById,
    fetchDropdownParts,
    fetchDropdownStatus,
    createMpr,
    updateMpr,
    deleteMpr,
    submitMpr,
    reviewMpr,
    bulkReviewMpr
  }
})