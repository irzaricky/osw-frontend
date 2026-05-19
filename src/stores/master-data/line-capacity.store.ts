import { defineStore } from 'pinia'
import { ref } from 'vue'
import lineCapacityService from '../../services/master-data/line-capacity.service'
import type {
  LineCapacityParamsResponse,
  LineCapacityCalculateResponse,
  LineCapacityCalculatePayload,
} from '../../types/master-data/line-capacity'

export const useLineCapacityStore = defineStore('lineCapacity', () => {

  // ── State ──────────────────────────────────────────────────────────────────

  // Cache params per line_id — agar tidak fetch ulang saat pindah tab
  const paramsCache = ref<Record<number, LineCapacityParamsResponse>>({})

  // Params line yang sedang aktif di UI
  const currentParams = ref<LineCapacityParamsResponse | null>(null)

  // Hasil calculate terakhir
  const calculateResult = ref<LineCapacityCalculateResponse | null>(null)

  const loading    = ref(false)
  const calculating = ref(false)
  const error      = ref<string | null>(null)

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Ambil params untuk satu line.
   * @param lineId   ID line yang ingin dilihat
   * @param force    true = bypass cache, fetch ulang dari server
   */
  async function fetchParams(lineId: number, force = false) {
    // Gunakan cache jika ada dan tidak di-force
    if (!force && paramsCache.value[lineId]) {
      currentParams.value = paramsCache.value[lineId]
      return paramsCache.value[lineId]
    }

    loading.value = true
    error.value   = null
    try {
      const { data } = await lineCapacityService.getParams(lineId)
      if (data.status) {
        paramsCache.value[lineId] = data.data
        currentParams.value       = data.data
      }
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

  /**
   * Hitung params dari kondisi aktual line dan simpan ke s_line_capacity_params.
   * Setelah berhasil, invalidate cache untuk line ini.
   */
  async function calculate(lineId: number, payload?: LineCapacityCalculatePayload) {
    calculating.value = true
    error.value       = null
    try {
      const { data } = await lineCapacityService.calculate(lineId, payload)
      if (data.status) {
        calculateResult.value = data.data
        // Invalidate cache — fetch ulang saat diperlukan
        delete paramsCache.value[lineId]
        // Update currentParams langsung dari hasil calculate
        if (data.data) {
          currentParams.value = {
            line:        data.data.line,
            saved_params: data.data.saved_params,
            actual:      data.data.calculated_from,
          }
          paramsCache.value[lineId] = currentParams.value
        }
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

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Ambil params dari cache tanpa fetch (untuk komponen yang perlu cek cepat) */
  function getCached(lineId: number): LineCapacityParamsResponse | null {
    return paramsCache.value[lineId] ?? null
  }

  /** Bersihkan cache satu line (misal setelah update stations/jobs) */
  function invalidate(lineId: number) {
    delete paramsCache.value[lineId]
    if (currentParams.value?.line?.id === lineId) {
      currentParams.value = null
    }
  }

  /** Reset seluruh state */
  function clearAll() {
    paramsCache.value   = {}
    currentParams.value = null
    calculateResult.value = null
    error.value         = null
  }

  // ── Expose ─────────────────────────────────────────────────────────────────

  return {
    paramsCache,
    currentParams,
    calculateResult,
    loading,
    calculating,
    error,

    fetchParams,
    calculate,
    getCached,
    invalidate,
    clearAll,
  }
})