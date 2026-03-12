import { defineStore } from 'pinia'
import { ref } from 'vue'
import shiftService, { type ShiftParams } from '../../services/master-data/shift.service'
import type { Shift, ShiftType, ShiftCategory } from '../../types/master-data/shift'

export const useShiftStore = defineStore('shift', () => {
  const shifts = ref<Shift[]>([])
  const dropdown = ref<Pick<Shift, 'id' | 'name' | 'shift_number' | 'type' | 'category'>[]>([])
  const shiftTypes = ref<ShiftType[]>([])
  const shiftCategories = ref<ShiftCategory[]>([])
  const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchShiftTypes() {
    try {
      const { data } = await shiftService.getDdType()
      if (data.status) shiftTypes.value = data.data
    } catch (e: any) {
      console.error('[shiftStore] fetchShiftTypes:', e)
    }
  }

  async function fetchShiftCategories() {
    try {
      const { data } = await shiftService.getDdCategory()
      if (data.status) shiftCategories.value = data.data
    } catch (e: any) {
      console.error('[shiftStore] fetchShiftCategories:', e)
    }
  }

  async function fetchDropdown() {
    try {
      const { data } = await shiftService.getDropdown()
      if (data.status) dropdown.value = data.data
    } catch (e: any) {
      console.error('[shiftStore] fetchDropdown:', e)
    }
  }

  async function fetchShifts(params: ShiftParams = {}) {
    loading.value = true
    error.value = null
    try {
      const { data } = await shiftService.getShifts(params)
      if (data.status) {
        shifts.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages,
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
    } finally {
      loading.value = false
    }
  }

  async function createShift(payload: Partial<Shift>) {
    loading.value = true
    error.value = null
    try {
      const { data } = await shiftService.createShift(payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateShift(id: number | string, payload: Partial<Shift>) {
    loading.value = true
    error.value = null
    try {
      const { data } = await shiftService.updateShift(id, payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteShift(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await shiftService.deleteShift(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function downloadShifts(params: ShiftParams = {}) {
    loading.value = true
    error.value = null
    try {
      const { data } = await shiftService.downloadShifts(params)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function uploadShifts(file: File) {
    loading.value = true
    error.value = null
    try {
      const { data } = await shiftService.uploadShifts(file)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    shifts, dropdown, shiftTypes, shiftCategories, meta, loading, error,
    fetchShiftTypes, fetchShiftCategories, fetchDropdown,
    fetchShifts, createShift, updateShift, deleteShift, downloadShifts, uploadShifts,
  }
})