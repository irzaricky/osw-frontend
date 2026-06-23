import { defineStore } from 'pinia'
import { ref }         from 'vue'
import workOrderMonitorService from '../../services/production-plan/wo-monitor.service'
import type {
  MonitorSummary,
  MonitorWO,
  MonitorParams,
} from '../../types/production-plan/wo-monitor'

export const useWorkOrderMonitorStore = defineStore('workOrderMonitor', () => {

  const summary     = ref<MonitorSummary | null>(null)
  const workOrders  = ref<MonitorWO[]>([])
  const loading     = ref(false)
  const error       = ref<string | null>(null)
  const lastFetched = ref<Date | null>(null)

  async function fetchLiveMonitor(params?: MonitorParams) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await workOrderMonitorService.getLiveMonitor(params)
      if (data.status) {
        summary.value    = data.data.summary
        workOrders.value = data.data.work_orders
        lastFetched.value = new Date()
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
    } finally {
      loading.value = false
    }
  }

  function clear() {
    summary.value    = null
    workOrders.value = []
    lastFetched.value = null
  }

  return { summary, workOrders, loading, error, lastFetched, fetchLiveMonitor, clear }
})