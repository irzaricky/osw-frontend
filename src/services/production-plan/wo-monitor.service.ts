import { api }           from '../../plugins/axios'
import type { MonitorParams } from '../../types/production-plan/wo-monitor'

const BASE = '/production-plan/work-order'

const workOrderMonitorService = {
  getLiveMonitor(params?: MonitorParams) {
    return api.get(`${BASE}/monitor/live`, { params })
  },
}

export default workOrderMonitorService