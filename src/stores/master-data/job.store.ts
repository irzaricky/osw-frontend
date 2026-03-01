import { defineStore } from 'pinia'
import { ref } from 'vue'
import jobService, { type JobParams } from '../../services/master-data/job.service'
import type { Job, JobType } from '../../types/master-data/job'

export const useJobStore = defineStore('job', () => {
  const jobs = ref<Job[]>([])
  const dropdown = ref<Pick<Job, 'id' | 'job_code' | 'name'>[]>([])
  const jobTypes = ref<JobType[]>([])
  const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchJobTypes() {
    try {
      const { data } = await jobService.getJobTypes()
      if (data.status) jobTypes.value = data.data
    } catch (e: any) {
      console.error('[jobStore] fetchJobTypes:', e)
    }
  }

  async function fetchDropdown() {
    try {
      const { data } = await jobService.getDropdown()
      if (data.status) dropdown.value = data.data
    } catch (e: any) {
      console.error('[jobStore] fetchDropdown:', e)
    }
  }

  async function fetchJobs(params: JobParams = {}) {
    loading.value = true
    error.value = null
    try {
      const { data } = await jobService.getJobs(params)
      if (data.status) {
        jobs.value = data.data.rows
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

  async function createJob(payload: Partial<Job>) {
    loading.value = true
    error.value = null
    try {
      const { data } = await jobService.createJob(payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateJob(id: number | string, payload: Partial<Job>) {
    loading.value = true
    error.value = null
    try {
      const { data } = await jobService.updateJob(id, payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteJob(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await jobService.deleteJob(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function downloadJobs(params: JobParams = {}) {
    loading.value = true
    error.value = null
    try {
      const { data } = await jobService.downloadJobs(params)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function uploadJobs(file: File) {
    loading.value = true
    error.value = null
    try {
      const { data } = await jobService.uploadJobs(file)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // state
    jobs, dropdown, jobTypes, meta, loading, error,
    // actions
    fetchJobTypes, fetchDropdown, fetchJobs,
    createJob, updateJob, deleteJob,
    downloadJobs, uploadJobs,
  }
})