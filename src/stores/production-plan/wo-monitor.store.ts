import { defineStore } from 'pinia'
import { ref }         from 'vue'
import workOrderMonitorService from '../../services/production-plan/wo-monitor.service'
import workOrderService        from '../../services/production-plan/work-order.service'
import type {
  MonitorSummary,
  MonitorWO,
  MonitorParams,
} from '../../types/production-plan/wo-monitor'
import type { ResolveIssuePayload } from '../../types/production-plan/work-order'

export const useWorkOrderMonitorStore = defineStore('workOrderMonitor', () => {

  const summary     = ref<MonitorSummary | null>(null)
  const workOrders  = ref<MonitorWO[]>([])
  const loading     = ref(false)
  const saving      = ref(false)
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

  async function resolveIssue(
    wo_id:       number,
    station_id:  number,
    issue_id:    number,
    payload:     ResolveIssuePayload,
  ) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.resolveStationIssue(wo_id, station_id, issue_id, payload)
      if (data.status) {
        const woIdx = workOrders.value.findIndex((w) => w.id === wo_id)
        if (woIdx !== -1) {
          const wo = workOrders.value[woIdx]
          const remainingIssues = wo.open_issues.filter((i) => i.id !== issue_id)
          workOrders.value[woIdx] = {
            ...wo,
            open_issues:      remainingIssues,
            open_issue_count: remainingIssues.length,
          }
        }
        if (summary.value) {
          summary.value = {
            ...summary.value,
            total_open_issues: Math.max(0, summary.value.total_open_issues - 1),
          }
        }
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  function clear() {
    summary.value    = null
    workOrders.value = []
    lastFetched.value = null
  }

  return { summary, workOrders, loading, saving, error, lastFetched, fetchLiveMonitor, resolveIssue, clear }
})