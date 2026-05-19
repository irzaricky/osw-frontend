import { defineStore } from 'pinia'
import { ref } from 'vue'
import orderScheduleService from '../../services/production-plan/order-schedule.service'
import type {
  ProductionOrder,
  PODropdownItem,
  POListParams,
  CreatePOPayload,
  UpdatePOPayload,
  AddProductPayload,
  UpdateProductPayload,
  AddSchedulePayload,
  UpdateSchedulePayload,
  ReschedulePayload,
  RejectPOPayload,
  CancelPOPayload,
  RescheduleLog,
} from '../../types/production-plan/order-schedule'

export const useOrderScheduleStore = defineStore('orderSchedule', () => {

  // ── State ──────────────────────────────────────────────────────────────────

  const orders        = ref<ProductionOrder[]>([])
  const currentOrder  = ref<ProductionOrder | null>(null)
  const dropdown      = ref<PODropdownItem[]>([])
  const rescheduleLogs = ref<RescheduleLog[]>([])

  const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })

  const loading  = ref(false)
  const saving   = ref(false)
  const error    = ref<string | null>(null)

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
      if (data.status && currentOrder.value) {
        currentOrder.value = { ...currentOrder.value, ...data.data }
      }
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

  // ── Products ───────────────────────────────────────────────────────────────

  async function addProduct(id: number | string, payload: AddProductPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.addProduct(id, payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function updateProduct(
    id: number | string,
    product_id: number | string,
    payload: UpdateProductPayload,
  ) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.updateProduct(id, product_id, payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function deleteProduct(id: number | string, product_id: number | string) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.deleteProduct(id, product_id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  // ── Schedules ──────────────────────────────────────────────────────────────

  async function addSchedule(
    id: number | string,
    product_id: number | string,
    payload: AddSchedulePayload,
  ) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.addSchedule(id, product_id, payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function updateSchedule(
    id: number | string,
    product_id: number | string,
    schedule_id: number | string,
    payload: UpdateSchedulePayload,
  ) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.updateSchedule(id, product_id, schedule_id, payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function deleteSchedule(
    id: number | string,
    product_id: number | string,
    schedule_id: number | string,
  ) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.deleteSchedule(id, product_id, schedule_id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  // ── Status Transitions ─────────────────────────────────────────────────────

  async function release(id: number | string) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.release(id)
      if (data.status && currentOrder.value) {
        currentOrder.value = { ...currentOrder.value, status: 'Released' }
      }
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
      if (data.status && currentOrder.value) {
        currentOrder.value = { ...currentOrder.value, status: 'Rejected' }
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function cancel(id: number | string, payload: CancelPOPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.cancel(id, payload)
      if (data.status && currentOrder.value) {
        currentOrder.value = { ...currentOrder.value, status: 'Cancelled' }
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function complete(id: number | string) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.complete(id)
      if (data.status && currentOrder.value) {
        currentOrder.value = { ...currentOrder.value, status: 'Completed' }
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function close(id: number | string) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.close(id)
      if (data.status && currentOrder.value) {
        currentOrder.value = { ...currentOrder.value, status: 'Closed' }
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  // ── Reschedule ─────────────────────────────────────────────────────────────

  async function reschedule(id: number | string, payload: ReschedulePayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await orderScheduleService.reschedule(id, payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function fetchRescheduleLogs(id: number | string) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await orderScheduleService.getRescheduleLogs(id)
      if (data.status) rescheduleLogs.value = data.data
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function clearCurrentOrder() {
    currentOrder.value   = null
    rescheduleLogs.value = []
  }

  // ── Expose ─────────────────────────────────────────────────────────────────

  return {
    orders,
    currentOrder,
    dropdown,
    rescheduleLogs,
    meta,
    loading,
    saving,
    error,

    fetchOrders,
    fetchOrder,
    fetchDropdown,
    createOrder,
    updateOrder,
    deleteOrder,
    addProduct,
    updateProduct,
    deleteProduct,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    release,
    reject,
    cancel,
    complete,
    close,
    reschedule,
    fetchRescheduleLogs,
    clearCurrentOrder,
  }
})