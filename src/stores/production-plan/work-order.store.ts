import { defineStore } from 'pinia'
import { ref }         from 'vue'
import workOrderService from '../../services/production-plan/work-order.service'
import type {
  WorkOrder,
  MaterialCheckResponse,
  DailySummary,
  WorkOrderListParams,
  DailySummaryParams,
  StartWorkOrderPayload,
} from '../../types/production-plan/work-order'

// Manages WO Line list, detail, start, and material pre-check.
// Station-level state (progress, issues, materials) lives in work-order-station.store.
export const useWorkOrderStore = defineStore('workOrder', () => {

  // ── State ────────────────────────────────────────────────────────────────────

  const workOrders    = ref<WorkOrder[]>([])
  const currentWO     = ref<WorkOrder | null>(null)
  const dailySummary  = ref<DailySummary | null>(null)
  const materialCheck = ref<MaterialCheckResponse | null>(null)

  const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })

  const loading       = ref(false)
  const saving        = ref(false)
  const checkingStock = ref(false)
  const error         = ref<string | null>(null)

  // ── List & Detail ────────────────────────────────────────────────────────────

  async function fetchWorkOrders(params: WorkOrderListParams = {}) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await workOrderService.getWorkOrders(params)
      if (data.status) {
        workOrders.value = data.data.rows
        meta.value = {
          page:       data.data.page,
          limit:      data.data.limit,
          total:      data.data.count,
          totalPages: data.data.totalPages,
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchWorkOrder(id: number | string) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await workOrderService.getWorkOrder(id)
      if (data.status) currentWO.value = data.data
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchDailySummary(params?: DailySummaryParams) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await workOrderService.getDailySummary(params)
      if (data.status) dailySummary.value = data.data
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
    } finally {
      loading.value = false
    }
  }

  // ── Start ────────────────────────────────────────────────────────────────────

  async function startWorkOrder(id: number | string, payload?: StartWorkOrderPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.startWorkOrder(id, payload)
      if (data.status && currentWO.value) {
        currentWO.value = {
          ...currentWO.value,
          status:            'In_Progress',
          actual_start_time: data.data?.actual_start_time ?? new Date().toISOString(),
        }
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  // ── Material Pre-check ───────────────────────────────────────────────────────

  async function checkMaterials(id: number | string) {
    checkingStock.value = true
    error.value         = null
    try {
      const { data } = await workOrderService.checkMaterials(id)
      if (data.status) materialCheck.value = data.data
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      checkingStock.value = false
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function clearCurrentWO() {
    currentWO.value     = null
    materialCheck.value = null
  }

  function clearList() {
    workOrders.value = []
    meta.value       = { page: 1, limit: 10, total: 0, totalPages: 0 }
  }

  return {
    workOrders,
    currentWO,
    dailySummary,
    materialCheck,
    meta,
    loading,
    saving,
    checkingStock,
    error,
    fetchWorkOrders,
    fetchWorkOrder,
    fetchDailySummary,
    startWorkOrder,
    checkMaterials,
    clearCurrentWO,
    clearList,
  }
})