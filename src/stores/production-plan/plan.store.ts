import { defineStore } from 'pinia'
import { ref } from 'vue'
import productionPlanService from '../../services/production-plan/plan.service'
import type {
  ProductionPlan,
  AvailableDO,
  PlanListParams,
  CreatePlanPayload,
  UpdatePlanPayload,
  CapacityParamPayload,
  UpdateCapacityParamPayload,
  CalculateCapacityPayload,
  ApprovePayload,
  RejectPayload,
  CalculationResult,
} from '../../types/production-plan/plan'

export const useProductionPlanStore = defineStore('productionPlan', () => {

  const plans        = ref<ProductionPlan[]>([])
  const currentPlan  = ref<ProductionPlan | null>(null)
  const availableDOs = ref<AvailableDO[]>([])

  const dropdown = ref<Pick<ProductionPlan,
    'id' | 'plan_number' | 'plan_month' | 'plan_type' | 'parent_plan_id' | 'parent_plan' |
    'plan_description' | 'earliest_delivery_date' | 'latest_delivery_date'
  >[]>([])

  const calculationResult = ref<CalculationResult | null>(null)

  const meta        = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const loading     = ref(false)
  const saving      = ref(false)
  const calculating = ref(false)
  const error       = ref<string | null>(null)

  async function fetchPlans(params: PlanListParams = {}) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await productionPlanService.getPlans(params)
      if (data.status) {
        plans.value = data.data.rows
        meta.value  = {
          page:       data.data.page,
          limit:      data.data.limit,
          total:      data.data.count,
          totalPages: data.data.totalPages,
        }
      }
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
    }
    finally {
      loading.value = false
    }
  }

  async function fetchPlan(id: number | string) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await productionPlanService.getPlan(id)
      if (data.status) currentPlan.value = data.data
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function fetchDropdown() {
    try {
      const { data } = await productionPlanService.getDropdown()
      if (data.status) dropdown.value = data.data
    }
    catch (e: any) {
      console.error('[productionPlanStore] fetchDropdown:', e)
    }
  }

  async function fetchAvailableDOs(plan_month: string) {
    loading.value = true
    try {
      const { data } = await productionPlanService.getAvailableDeliveryOrders(plan_month)
      if (data.status) availableDOs.value = data.data?.delivery_orders ?? []
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function syncDOs(id: number | string, payload: { do_ids: number[] }) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await productionPlanService.syncDOs(id, payload)
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      saving.value = false
    }
  }

  async function createPlan(payload: CreatePlanPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await productionPlanService.createPlan(payload)
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      saving.value = false
    }
  }

  async function updatePlan(id: number | string, payload: UpdatePlanPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await productionPlanService.updatePlan(id, payload)
      if (data.status && currentPlan.value) {
        currentPlan.value = { ...currentPlan.value, ...data.data }
      }
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      saving.value = false
    }
  }

  async function deletePlan(id: number | string) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await productionPlanService.deletePlan(id)
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      saving.value = false
    }
  }

  async function saveCapacityParams(id: number | string, payload: CapacityParamPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await productionPlanService.saveCapacityParams(id, payload)
      if (data.status) {
        await fetchPlan(id)
      }
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      saving.value = false
    }
  }

  async function updateCapacityParams(id: number | string, payload: UpdateCapacityParamPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await productionPlanService.updateCapacityParams(id, payload)
      if (data.status) {
        await fetchPlan(id)
      }
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      saving.value = false
    }
  }

  async function calculateCapacity(id: number | string, payload: CalculateCapacityPayload) {
    calculating.value = true
    error.value       = null
    try {
      const { data } = await productionPlanService.calculateCapacity(id, payload)
      if (data.status) {
        calculationResult.value = data.data
        await fetchPlan(id)
      }
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      calculating.value = false
    }
  }

  async function calculateAllCapacity(id: number | string) {
    calculating.value = true
    error.value       = null
    try {
      const { data } = await productionPlanService.calculateAllCapacity(id)
      if (data.status) {
        calculationResult.value = data.data
        await fetchPlan(id)
      }
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      calculating.value = false
    }
  }

  async function submitForApproval(id: number | string) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await productionPlanService.submitForApproval(id)
      if (data.status && currentPlan.value) {
        currentPlan.value = { ...currentPlan.value, status: 'Pending_Approval' }
      }
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      saving.value = false
    }
  }

  async function approve(id: number | string, payload?: ApprovePayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await productionPlanService.approve(id, payload)
      if (data.status && currentPlan.value) {
        currentPlan.value = { ...currentPlan.value, status: 'Approved' }
      }
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      saving.value = false
    }
  }

  async function reject(id: number | string, payload: RejectPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await productionPlanService.reject(id, payload)
      if (data.status && currentPlan.value) {
        currentPlan.value = { ...currentPlan.value, status: 'Rejected' }
      }
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      saving.value = false
    }
  }

  function clearCurrentPlan() {
    currentPlan.value       = null
    calculationResult.value = null
  }

  return {
    plans,
    currentPlan,
    availableDOs,
    dropdown,
    calculationResult,
    meta,
    loading,
    saving,
    calculating,
    error,

    fetchPlans,
    fetchPlan,
    fetchDropdown,
    fetchAvailableDOs,
    syncDOs,
    createPlan,
    updatePlan,
    deletePlan,
    saveCapacityParams,
    updateCapacityParams,
    calculateCapacity,
    calculateAllCapacity,
    submitForApproval,
    approve,
    reject,
    clearCurrentPlan,
  }
})