import { defineStore } from 'pinia'
import { ref } from 'vue'
import uomService from '../../services/master-data/uom.service'
import type {
  Uom,
  UomDropdownItem,
  UomListParams,
  CreateUomPayload,
  UpdateUomPayload,
} from '../../types/master-data/uom'

export const useUomStore = defineStore('uom', () => {

  // ── State ──────────────────────────────────────────────────────────────────

  const uoms     = ref<Uom[]>([])
  const dropdown = ref<UomDropdownItem[]>([])
  const meta     = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })

  const loading = ref(false)
  const saving  = ref(false)
  const error   = ref<string | null>(null)

  // ── Actions ────────────────────────────────────────────────────────────────

  async function fetchDropdown(search?: string) {
    try {
      const { data } = await uomService.dropdown(search)
      if (data.status) dropdown.value = data.data
      return data
    } catch (e: any) {
      console.error('[uomStore] fetchDropdown:', e)
    }
  }

  async function fetchList(params: UomListParams = {}) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await uomService.list(params)
      if (data.status) {
        uoms.value = data.data.rows
        meta.value = {
          page:       data.data.page,
          limit:      data.data.limit,
          total:      data.data.count,
          totalPages: data.data.totalPages,
        }
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateUomPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await uomService.create(payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function update(id: number | string, payload: UpdateUomPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await uomService.update(id, payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function remove(id: number | string) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await uomService.delete(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  // ── Expose ─────────────────────────────────────────────────────────────────

  return {
    uoms,
    dropdown,
    meta,
    loading,
    saving,
    error,

    fetchDropdown,
    fetchList,
    create,
    update,
    remove,
  }
})