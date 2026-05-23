import { defineStore } from 'pinia'
import { ref } from 'vue'
import orderScheduleService from '../../services/production-plan/order-schedule.service'
import type {
  ProductionOrder,
  PODropdownItem,
  POListParams,
  CreatePOPayload,
  UpdatePOPayload,
  UpdateSchedulePayload,
  ReschedulePayload,
  ApprovePOPayload,
  RejectPOPayload,
} from '../../types/production-plan/order-schedule'

export const useOrderScheduleStore = defineStore('orderSchedule', () => {

  // ── State ──────────────────────────────────────────────────────────────────
  const orders       = ref<ProductionOrder[]>([])
  const currentOrder = ref<ProductionOrder | null>(null)
  const dropdown     = ref<PODropdownItem[]>([])
  const meta         = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const loading      = ref(false)
  const saving       = ref(false)
  const error        = ref<string | null>(null)

  // ── List & Detail ──────────────────────────────────────────────────────────
  async function fetchOrders(params: POListParams = {}) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await orderScheduleService.getOrders(params)
      if (data.status) {
        orders.value = data.data.rows
        meta.value   = {
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

  async function fetchOrder(id: number | string) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await orderScheduleService.getOrder(id)
      if (data.status) currentOrder.value = data.data
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchDropdown() {
    try {
      const { data } = await orderScheduleService.getDropdown()
      if (data.status) dropdown.value = data.data
    } catch (e: any) {
      console.error('[orderScheduleStore] fetchDropdown:', e)
    }
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  async function createOrder(payload: CreatePOPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.createOrder(payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function updateOrder(id: number | string, payload: UpdatePOPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.updateOrder(id, payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function deleteOrder(id: number | string) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.deleteOrder(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  // ── Generate Schedule ──────────────────────────────────────────────────────
  async function generateSchedule(id: number | string) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.generateSchedule(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  // ── Schedule Manual Edit ───────────────────────────────────────────────────
  async function updateSchedule(
    id: number | string,
    schedule_id: number | string,
    payload: UpdateSchedulePayload,
  ) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.updateSchedule(id, schedule_id, payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  // ── Status Transitions ─────────────────────────────────────────────────────
  async function submit(id: number | string) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.submit(id)
      if (data.status && currentOrder.value)
        currentOrder.value = { ...currentOrder.value, status: 'Pending_Approval' }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function approve(id: number | string, payload: ApprovePOPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.approve(id, payload)
      if (data.status && currentOrder.value)
        currentOrder.value = { ...currentOrder.value, status: 'Approved' }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function reject(id: number | string, payload: RejectPOPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.reject(id, payload)
      if (data.status && currentOrder.value)
        currentOrder.value = { ...currentOrder.value, status: 'Draft' }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function release(id: number | string) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.release(id)
      if (data.status && currentOrder.value)
        currentOrder.value = { ...currentOrder.value, status: 'Released' }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function reschedule(id: number | string, payload: ReschedulePayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.reschedule(id, payload)
      if (data.status && currentOrder.value)
        currentOrder.value = { ...currentOrder.value, status: 'Approved', total_scheduled_qty: 0 }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function clearCurrentOrder() {
    currentOrder.value = null
    error.value        = null
  }

  return {
    orders, currentOrder, dropdown, meta,
    loading, saving, error,
    fetchOrders, fetchOrder, fetchDropdown,
    createOrder, updateOrder, deleteOrder,
    generateSchedule, updateSchedule,
    submit, approve, reject, release, reschedule,
    clearCurrentOrder,
  }
})