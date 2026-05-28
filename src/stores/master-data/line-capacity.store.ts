import { defineStore } from 'pinia'
import { ref } from 'vue'
import lineCapacityService from '../../services/master-data/line-capacity.service'
import type {
  LineCapacityParamsResponse,
  LineCapacityPreviewResponse,
  LineCapacityCalculateResponse,
  LineCapacityCalculatePayload,
} from '../../types/master-data/line-capacity'
 
export const useLineCapacityStore = defineStore('lineCapacity', () => {
 
  // ── State ──────────────────────────────────────────────────────────────────
 
  // Cache params per line_id
  const paramsCache = ref<Record<number, LineCapacityParamsResponse>>({})
 
  // Params line yang sedang aktif di UI
  const currentParams = ref<LineCapacityParamsResponse | null>(null)
 
  // Preview result (sebelum calculate)
  const previewResult = ref<LineCapacityPreviewResponse | null>(null)
 
  // Hasil calculate terakhir
  const calculateResult = ref<LineCapacityCalculateResponse | null>(null)
 
  const loading        = ref(false)
  const previewing     = ref(false)
  const calculating    = ref(false)
  const deleting       = ref(false)
  const error          = ref<string | null>(null)
 
  // ── Actions ────────────────────────────────────────────────────────────────
 
  /**
   * Ambil semua params untuk satu line (multi-baris per bulan).
   * @param lineId  ID line
   * @param force   true = bypass cache, fetch ulang dari server
   * @param year    filter per tahun (opsional)
   */
  async function fetchParams(lineId: number, force = false, year?: number) {
    if (!force && !year && paramsCache.value[lineId]) {
      currentParams.value = paramsCache.value[lineId]
      return { status: true, data: paramsCache.value[lineId] }
    }
 
    loading.value = true
    error.value   = null
    try {
      const { data } = await lineCapacityService.getParams(lineId, year)
      if (data.status) {
        if (!year) {
          paramsCache.value[lineId] = data.data
        }
        currentParams.value = data.data
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      loading.value = false
    }
  }
 
  /**
   * Preview kalkulasi dari shift calendar untuk bulan tertentu (tanpa menyimpan).
   */
  async function fetchPreview(lineId: number, year?: number, month?: number) {
    previewing.value = true
    error.value      = null
    try {
      const { data } = await lineCapacityService.previewParams(lineId, year, month)
      if (data.status) {
        previewResult.value = data.data
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      previewing.value = false
    }
  }
 
  /**
   * Hitung dan simpan params untuk bulan yang dipilih.
   * Setelah berhasil, invalidate cache untuk line ini.
   */
  async function calculate(lineId: number, payload?: LineCapacityCalculatePayload) {
    calculating.value = true
    error.value       = null
    try {
      const { data } = await lineCapacityService.calculate(lineId, payload)
      if (data.status) {
        calculateResult.value = data.data
        // Invalidate cache agar data terbaru diambil ulang
        delete paramsCache.value[lineId]
        await fetchParams(lineId, true)
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      calculating.value = false
    }
  }
 
  /**
   * Hapus satu baris params untuk bulan tertentu.
   */
  async function deleteParam(lineId: number, year: number, month: number) {
    deleting.value = true
    error.value    = null
    try {
      const { data } = await lineCapacityService.deleteParam(lineId, year, month)
      if (data.status) {
        // Update cache: hapus baris yang didelete dari array params
        if (paramsCache.value[lineId]) {
          paramsCache.value[lineId].params = paramsCache.value[lineId].params.filter(
            (p) => !(p.param_year === year && p.param_month === month)
          )
          paramsCache.value[lineId].total_params = paramsCache.value[lineId].params.length
          if (currentParams.value?.line?.id === lineId) {
            currentParams.value = paramsCache.value[lineId]
          }
        }
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      deleting.value = false
    }
  }
 
  // ── Helpers ────────────────────────────────────────────────────────────────
 
  function getCached(lineId: number): LineCapacityParamsResponse | null {
    return paramsCache.value[lineId] ?? null
  }
 
  function invalidate(lineId: number) {
    delete paramsCache.value[lineId]
    if (currentParams.value?.line?.id === lineId) {
      currentParams.value = null
    }
  }
 
  function clearAll() {
    paramsCache.value     = {}
    currentParams.value   = null
    previewResult.value   = null
    calculateResult.value = null
    error.value           = null
  }
 
  // ── Expose ─────────────────────────────────────────────────────────────────
 
  return {
    paramsCache,
    currentParams,
    previewResult,
    calculateResult,
    loading,
    previewing,
    calculating,
    deleting,
    error,
 
    fetchParams,
    fetchPreview,
    calculate,
    deleteParam,
    getCached,
    invalidate,
    clearAll,
  }
})