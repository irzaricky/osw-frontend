/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import sdpService, { type SdpParams } from '../../services/sales/sdp.service'
import shiftService from '../../services/master-data/shift.service'
import type { Sdp, SdpDropdownWarehouse, SdpDropdownDock } from '../../types/sales/sdp'
import type { Shift } from '../../types/master-data/shift'

export const useSdpStore = defineStore('sdp', () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const plans = ref<Sdp[]>([])
  const detail = ref<Sdp | null>(null)
  const warehouses = ref<SdpDropdownWarehouse[]>([])
  const docks = ref<SdpDropdownDock[]>([])
  const availableSpoItems = ref<any[]>([])
  const maxVehicleCapacity = ref<number>(100)
  const shifts = ref<Shift[]>([])

  const loading = ref(false)
  const error = ref<string | null>(null)

  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // ─── Actions ─────────────────────────────────────────────────────────────────
  async function fetchSdpPlans(params: SdpParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await sdpService.getSdpPlans(params)
      const data = response.data
      if (data.status) {
        plans.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching SDP plans:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchSdpById(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await sdpService.getSdpById(id)
      const data = response.data
      if (data.status) {
        detail.value = data.data
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error(`Error fetching SDP ${id}:`, e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchDropdownWarehouses() {
    try {
      const response = await sdpService.getDropdownWarehouses()
      const data = response.data
      if (data.status) {
        warehouses.value = data.data
      }
    } catch (e: any) {
      console.error('Error fetching warehouses dropdown:', e)
    }
  }

  async function fetchDropdownDocks() {
    try {
      const response = await sdpService.getDropdownDocks()
      const data = response.data
      if (data.status) {
        docks.value = data.data
      }
    } catch (e: any) {
      console.error('Error fetching docks dropdown:', e)
    }
  }

  async function fetchShifts() {
    try {
      const response = await shiftService.getShifts({ page: 1, limit: 100 })
      const data = response.data
      if (data.status) {
        shifts.value = data.data.rows
      }
    } catch (e: any) {
      console.error('Error fetching shifts:', e)
    }
  }

  async function fetchMaxVehicleCapacity() {
    try {
      const response = await sdpService.getMaxVehicleCapacity()
      const data = response.data
      if (data.status) {
        maxVehicleCapacity.value = data.data
      }
    } catch (e: any) {
      console.error('Error fetching max vehicle capacity:', e)
    }
  }

  async function fetchAvailableSpoItems(spoId?: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await sdpService.getAvailableSpoItems(spoId ? { spo_id: spoId } : undefined)
      const data = response.data
      if (data.status) {
        availableSpoItems.value = data.data
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching available SPO items:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createSdp(data: Record<string, any>) {
    loading.value = true
    error.value = null
    try {
      const response = await sdpService.createSdp(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error creating SDP:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateSdp(id: number | string, data: Record<string, any>) {
    loading.value = true
    error.value = null
    try {
      const response = await sdpService.updateSdp(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error(`Error updating SDP ${id}:`, e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteSdp(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await sdpService.deleteSdp(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error(`Error deleting SDP ${id}:`, e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    plans,
    detail,
    warehouses,
    docks,
    availableSpoItems,
    maxVehicleCapacity,
    shifts,
    loading,
    error,
    meta,
    // Actions
    fetchSdpPlans,
    fetchSdpById,
    fetchDropdownWarehouses,
    fetchDropdownDocks,
    fetchShifts,
    fetchAvailableSpoItems,
    fetchMaxVehicleCapacity,
    createSdp,
    updateSdp,
    deleteSdp
  }
})
