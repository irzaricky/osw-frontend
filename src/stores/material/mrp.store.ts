import { defineStore } from 'pinia'
import { ref } from 'vue'
import mrpService, { type MrpParams } from '../../services/material/mrp.service'
import type { Mrp, SalesPlanLoadData } from '../../types/material/mrp'

export const useMrpStore = defineStore('mrp', () => {
  // State
  const mrps = ref<Mrp[]>([])
  const detail = ref<Mrp | null>(null)

  // Dropdowns
  const salesPlansDropdown = ref<{ id: number; spr_number: string; description?: string }[]>([])
  const partsDropdown = ref<{ id: number; part_number: string; part_name: string; uom?: { id: number; name: string; code: string } }[]>([])
  const statusDropdown = ref<string[]>([])
  const priorityDropdown = ref<string[]>([])

  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchMrps(params: MrpParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await mrpService.getMrps(params)
      const data = response.data
      if (data.status) {
        mrps.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching MRPs:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchMrpById(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await mrpService.getMrpById(id)
      const data = response.data
      if (data.status) {
        detail.value = data.data
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchDropdownSalesPlans(params?: Record<string, any>) {
    try {
      const response = await mrpService.ddSalesPlans(params)
      if (response.data?.status) {
        salesPlansDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching sales plans dropdown:', e)
    }
  }

  async function fetchDropdownParts(params?: Record<string, any>) {
    try {
      const response = await mrpService.ddParts(params)
      if (response.data?.status) {
        partsDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching parts dropdown:', e)
    }
  }

  async function fetchDropdownStatus(params?: Record<string, any>) {
    try {
      const response = await mrpService.ddStatus(params)
      if (response.data?.status) {
        statusDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching status dropdown:', e)
    }
  }

  async function fetchDropdownPriority(params?: Record<string, any>) {
    try {
      const response = await mrpService.ddPriority(params)
      if (response.data?.status) {
        priorityDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching priority dropdown:', e)
    }
  }

  async function loadSalesPlan(sprId: number | string): Promise<SalesPlanLoadData | null> {
    loading.value = true
    error.value = null
    try {
      const response = await mrpService.loadSalesPlan(sprId)
      const data = response.data
      if (data.status) {
        // Backend returns: { spr, products, suggestedDetails, warehouseStock, skipped_products, total_materials }
        // Normalise into SalesPlanLoadData shape used by the frontend
        const raw = data.data
        const normalised: SalesPlanLoadData = {
          primary_bom: raw.primary_bom,
          salesPlan: {
            id: raw.spr?.id,
            spr_number: raw.spr?.spr_number,
            description: raw.spr?.spr_name,
            details: (raw.products ?? []).map((p: any) => ({
              id: p.part_id,
              part_id: p.part_id,
              qty: p.qty_request,
              part: {
                id: p.part_id,
                part_number: p.part_number,
                part_name: p.part_name,
              }
            }))
          },
          bomDetails: [],  // not needed by modal; kept for type compatibility
          warehouseStock: (raw.warehouseStock ?? []).map((w: any) => ({
            part_id: w.part_id,
            qty_on_hand: w.qty_on_hand ?? 0,
          })),
          suggestedDetails: (raw.suggestedDetails ?? []).map((d: any) => ({
            part_id: d.part_id,
            qty: d.qty,
            bom_id: d.bom_id,
            part: d.part,
          }))
        }
        return normalised
      }
      return null
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createMrp(data: Partial<Mrp> & { details?: any[]; save_as_draft?: boolean }) {
    loading.value = true
    error.value = null
    try {
      const response = await mrpService.createMrp(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateMrp(id: number | string, data: Partial<Mrp> & { save_as_draft?: boolean }) {
    loading.value = true
    error.value = null
    try {
      const response = await mrpService.updateMrp(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateMrpDetail(id: number | string, data: { details: any[] }) {
    loading.value = true
    error.value = null
    try {
      const response = await mrpService.updateMrpDetail(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function submitMrp(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await mrpService.submitMrp(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function reviewMrp(id: number | string, data: { action: 'approve' | 'reject'; notes?: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await mrpService.reviewMrp(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function bulkReviewMrp(data: { ids: number[]; action: 'approve' | 'reject'; notes?: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await mrpService.bulkReviewMrp(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteMrp(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await mrpService.deleteMrp(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    mrps,
    detail,
    salesPlansDropdown,
    partsDropdown,
    statusDropdown,
    priorityDropdown,
    meta,
    loading,
    error,
    fetchMrps,
    fetchMrpById,
    fetchDropdownSalesPlans,
    fetchDropdownParts,
    fetchDropdownStatus,
    fetchDropdownPriority,
    loadSalesPlan,
    createMrp,
    updateMrp,
    updateMrpDetail,
    submitMrp,
    reviewMrp,
    bulkReviewMrp,
    deleteMrp
  }
})