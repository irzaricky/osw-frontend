import { api } from '../../plugins/axios'
import type { AuditLogParams } from '../../types/master-data/audit-log'

const auditLogService = {
  getLogs(params?: AuditLogParams) {
    return api.get('/master-data/logs/', { params })
  },

  getLogById(id: number | string) {
    return api.get(`/master-data/logs/${id}`)
  },

  downloadLogs(params?: AuditLogParams) {
    return api.get('/master-data/logs/download', { params, responseType: 'blob' })
  },

  getModules() {
    return api.get('/master-data/logs/dd-modules')
  },

  getActivities() {
    return api.get('/master-data/logs/dd-activity')
  },

  getUsers() {
    return api.get('/master-data/logs/dd-users')
  }
}

export default auditLogService
