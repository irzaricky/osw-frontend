import { defineStore } from 'pinia'
import { ref } from 'vue'
import sprService, { type SprParams } from '../../services/sales/spr.service'
import type { Spr } from '../../types/sales/spr'

export const useSprStore = defineStore('spr', () => {
  // State
  const sprs = ref<Spr[]>([])
  const detail = ref<Spr | null>(null)
  const logs = ref<any[]>([])

  // Dropdowns
  const partsDropdown = ref<{ id: number; part_number: string; part_name: string }[]>([])
  const statusDropdown = ref<string[]>([])
  const sourceDropdown = ref<string[]>([])

  // PPIC Aggregation state
  const ppicAggregation = ref<{
    target_month: string
    months: string[]
    parts: { part_id: number; part_number: string; part_name: string }[]
    matrix: Record<string, Record<string, { total_qty: number; spr_count: number; sprs: any[] }>>
    month_totals: Record<string, number>
    part_totals: Record<string, number>
    grand_total: number
    pending_spr_count: number
    pending_sprs: any[]
  } | null>(null)

  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async function fetchSprs(params: SprParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await sprService.getSprs(params)
      const data = response.data
      if (data.status) {
        sprs.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching SPRs:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchSprById(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await sprService.getSprById(id)
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
      const response = await sprService.ddParts(params)
      if (response.data?.status) {
        partsDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching parts dropdown:', e)
    }
  }

  async function fetchDropdownStatus(params?: Record<string, any>) {
    try {
      const response = await sprService.ddStatus(params)
      if (response.data?.status) {
        statusDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching status dropdown:', e)
    }
  }

  async function fetchDropdownSource(params?: Record<string, any>) {
    try {
      const response = await sprService.ddSource(params)
      if (response.data?.status) {
        sourceDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching source dropdown:', e)
    }
  }

  async function createSpr(data: Record<string, any>) {
    loading.value = true
    error.value = null
    try {
      const response = await sprService.createSpr(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateSpr(id: number | string, data: Record<string, any>) {
    loading.value = true
    error.value = null
    try {
      const response = await sprService.updateSpr(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteSpr(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await sprService.deleteSpr(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function submitSpr(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await sprService.submitSpr(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function reviewSalesSpr(id: number | string, data: { status: string; remarks?: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await sprService.reviewSalesSpr(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function reviewPpicSpr(id: number | string, data: { status: string; remarks?: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await sprService.reviewPpicSpr(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function exportSpr(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await sprService.exportSpr(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function exportLogSnapshot(logId: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await sprService.exportLogSnapshot(logId)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function getTemplate() {
    loading.value = true
    error.value = null
    try {
      const response = await sprService.getTemplate()
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function uploadTemplate(file: File) {
    loading.value = true
    error.value = null
    try {
      const response = await sprService.uploadTemplate(file)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchPpicAggregation(params?: { month?: string; part_id?: number }) {
    loading.value = true
    error.value = null
    try {
      const response = await sprService.getPpicAggregation(params)
      const data = response.data
      if (data.status) {
        ppicAggregation.value = data.data
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function batchApprovePpic(data: { month: string; remarks?: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await sprService.ppicBatchApprove(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    sprs,
    detail,
    logs,
    partsDropdown,
    statusDropdown,
    sourceDropdown,
    meta,
    loading,
    error,
    fetchSprs,
    fetchSprById,
    fetchDropdownParts,
    fetchDropdownStatus,
    fetchDropdownSource,
    createSpr,
    updateSpr,
    deleteSpr,
    submitSpr,
    reviewSalesSpr,
    reviewPpicSpr,
    exportSpr,
    exportLogSnapshot,
    getTemplate,
    uploadTemplate,
    ppicAggregation,
    fetchPpicAggregation,
    batchApprovePpic
  }
})
