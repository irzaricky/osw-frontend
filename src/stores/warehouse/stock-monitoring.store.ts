import { defineStore } from 'pinia'
import { ref } from 'vue'
import stockMonitoringService, {
  type StockMonitoringParams
} from '../../services/warehouse/stock-monitoring.service'
import type {
  StockMonitoringSummary,
  StockByPart,
  StockPartLabel,
  StockByBin,
  StockBinItem
} from '../../types/warehouse/stock-monitoring'

export const useStockMonitoringStore = defineStore('stock-monitoring', () => {
  const summary = ref<StockMonitoringSummary | null>(null)
  const parts = ref<StockByPart[]>([])
  const bins = ref<StockByBin[]>([])

  const partLabels = ref<Record<string, StockPartLabel[]>>({})
  const binStocks = ref<Record<string, StockBinItem[]>>({})

  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSummary() {
    loading.value = true
    error.value = null
    try {
      const res = await stockMonitoringService.getSummary()
      if (res.data.status) summary.value = res.data.data
      return res.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchParts(params: StockMonitoringParams = {}) {
  loading.value = true
  error.value = null
  try {
    const res = await stockMonitoringService.getParts(params)
    if (res.data.status) parts.value = res.data.data
    return res.data
  } catch (e: any) {
    error.value = e.response?.data?.message || e.message
    throw e
  } finally {
    loading.value = false
  }
}

  async function fetchBins(params: StockMonitoringParams = {}) {
  loading.value = true
  error.value = null
  try {
    const res = await stockMonitoringService.getBins(params)
    if (res.data.status) bins.value = res.data.data
    return res.data
  } catch (e: any) {
    error.value = e.response?.data?.message || e.message
    throw e
  } finally {
    loading.value = false
  }
}

  async function fetchPartLabels(partNumber: string) {
    const res = await stockMonitoringService.getPartLabels(partNumber)
    if (res.data.status) partLabels.value[partNumber] = res.data.data
    return res.data
  }

  async function fetchBinStocks(binId: number | string) {
    const key = String(binId)
    const res = await stockMonitoringService.getBinStocks(binId)
    if (res.data.status) binStocks.value[key] = res.data.data
    return res.data
  }

  return {
    summary,
    parts,
    bins,
    partLabels,
    binStocks,
    loading,
    error,

    fetchSummary,
    fetchParts,
    fetchBins,
    fetchPartLabels,
    fetchBinStocks
  }
})