import { defineStore } from 'pinia'
import { ref } from 'vue'
import auditLogService from '../../services/master-data/audit-log.service'
import type { AuditLog, AuditLogParams } from '../../types/master-data/audit-log'

export const useAuditLogStore = defineStore('audit-log', () => {
  // State
  const logs = ref<AuditLog[]>([])
  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchLogs(params: AuditLogParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await auditLogService.getLogs(params)
      const data = response.data
      if (data.status) {
        logs.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching logs:', e)
    } finally {
      loading.value = false
    }
  }

  async function downloadLogs(params: AuditLogParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await auditLogService.downloadLogs(params)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    logs,
    meta,
    loading,
    error,
    fetchLogs,
    downloadLogs
  }
})
