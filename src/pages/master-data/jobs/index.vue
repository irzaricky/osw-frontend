<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useJobStore } from '../../../stores/master-data/job.store'
import { useJobColumns } from './composables/useJobColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { Job } from '../../../types/master-data/job'
import type { Row } from '@tanstack/table-core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import UploadExcelModal from '../../../components/UploadExcelModal.vue'
import JobFilters from './components/JobFilters.vue'
import JobFormModal from './components/JobFormModal.vue'

const jobStore = useJobStore()
const { jobs, jobTypes, meta, loading } = storeToRefs(jobStore)
const { toastSuccess, toastError } = useAppToast()

const table = ref<{ tableApi: { getFilteredSelectedRowModel: () => { rows: any[] } } } | null>(null)

const ui = {
  UCheckbox: resolveComponent('UCheckbox') as any,
  UButton: resolveComponent('UButton') as any,
  UDropdownMenu: resolveComponent('UDropdownMenu') as any,
  UBadge: resolveComponent('UBadge') as any,
}

const { columns } = useJobColumns({ onEdit: openEditModal, onDelete: confirmDelete }, ui)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Master Data' },
  { label: 'Jobs' },
]

const search = ref('')
const filters = reactive({
  job_type_id: undefined as number | undefined,
  active: undefined as boolean | undefined,
})

const rowSelection = ref({})

const selectedCount = computed(
  () => table.value?.tableApi?.getFilteredSelectedRowModel().rows.length ?? 0
)

const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const isUploadOpen = ref(false)

const emptyJob = (): Partial<Job> => ({
  job_code: '', name: '', job_type_id: undefined, standard_time: 0, active: true,
})

const currentJob = reactive<Partial<Job>>(emptyJob())

const confirm = reactive({
  open: false,
  title: '',
  description: '',
  action: null as (() => Promise<void>) | null,
})

async function fetchData() {
  const params: Record<string, any> = {
    page: meta.value.page,
    limit: meta.value.limit,
    search: search.value,
  }
  if (filters.job_type_id) params.job_type_id = filters.job_type_id
  if (filters.active !== undefined) params.active = filters.active
  await jobStore.fetchJobs(params)
}

const debouncedSearch = useDebounceFn(() => { meta.value.page = 1; fetchData() }, 300)
watch(search, debouncedSearch)
watch(filters, () => { meta.value.page = 1; fetchData() }, { deep: true })

async function handleDownload() {
  try {
    const params: Record<string, any> = { search: search.value }
    if (filters.job_type_id) params.job_type_id = filters.job_type_id
    const blob = await jobStore.downloadJobs(params)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Jobs_${Date.now()}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) { toastError(e) }
}

async function handleUpload(file: File) {
  try {
    const res = await jobStore.uploadJobs(file)
    toastSuccess(res.message || 'Upload successful')
    isUploadOpen.value = false
    fetchData()
  } catch (e) { toastError(e) }
}

function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentJob, emptyJob())
  isModalOpen.value = true
}

function openEditModal(job: Job) {
  modalMode.value = 'edit'
  Object.assign(currentJob, {
    id: job.id,
    job_code: job.job_code,
    name: job.name,
    job_type_id: job.job_type_id,
    standard_time: job.standard_time,
    active: job.active,
  })
  isModalOpen.value = true
}

async function handleSave(data: Partial<Job>) {
  try {
    let res
    if (modalMode.value === 'add') {
      res = await jobStore.createJob(data)
    } else {
      res = await jobStore.updateJob(currentJob.id!, data)
    }
    toastSuccess(res.message || 'Saved')
    isModalOpen.value = false
    fetchData()
  } catch (e) { toastError(e) }
}

function confirmDelete(job: Job) {
  confirm.title = 'Delete Job'
  confirm.description = `Delete job "${job.name}"?`
  confirm.action = async () => {
    try {
      const res = await jobStore.deleteJob(job.id)
      toastSuccess(res.message || 'Job deleted')
      fetchData()
      confirm.open = false
    } catch (e) { toastError(e); confirm.open = false }
  }
  confirm.open = true
}

function confirmBulkDelete() {
  const rows = table.value?.tableApi?.getFilteredSelectedRowModel().rows ?? []
  if (!rows.length) return
  confirm.title = 'Delete Selected'
  confirm.description = `Delete ${rows.length} job(s)?`
  confirm.action = async () => {
    try {
      await Promise.all(rows.map((r: Row<Job>) => jobStore.deleteJob(r.original.id)))
      toastSuccess(`${rows.length} jobs deleted`)
      rowSelection.value = {}
      fetchData()
      confirm.open = false
    } catch (e) { toastError(e); confirm.open = false }
  }
  confirm.open = true
}

onMounted(() => {
  fetchData()
  jobStore.fetchJobTypes()
})
</script>

<template>
  <div class="p-6 space-y-5">
    <Breadcrumbs :items="breadcrumbItems" />

    <h1 class="text-2xl font-bold">Job Management</h1>

    <JobFilters
      :search="search"
      :filters="filters"
      :job-types="jobTypes"
      @update:search="search = $event"
      @update:filters="Object.assign(filters, $event)"
    />

    <!-- Toolbar -->
    <div class="flex items-center gap-2">
      <UButton icon="i-lucide-download" color="neutral" variant="ghost" label="Export" @click="handleDownload" />
      <UButton icon="i-lucide-upload" color="neutral" variant="ghost" label="Import" @click="isUploadOpen = true" />
      <UButton icon="i-lucide-plus" color="primary" label="Add Job" @click="openAddModal" />
    </div>

    <!-- Bulk action bar -->
    <div v-if="selectedCount > 0" class="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
      <span class="text-sm text-primary font-medium">{{ selectedCount }} selected</span>
      <UButton icon="i-lucide-trash-2" color="error" variant="soft" label="Delete Selected" size="sm" @click="confirmBulkDelete" />
    </div>

    <!-- Table -->
    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      :data="jobs"
      :columns="columns"
      :loading="loading"
      class="w-full"
    />

    <!-- Pagination -->
    <div class="flex items-center justify-between border-t border-default pt-4">
      <span class="text-sm text-muted">{{ selectedCount }} of {{ meta.total }} row(s)</span>
      <UPagination
        v-model:page="meta.page"
        :total="meta.total"
        :items-per-page="meta.limit"
        @update:page="fetchData"
      />
    </div>

    <!-- Modals -->
    <JobFormModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :job="currentJob"
      :job-types="jobTypes"
      :loading="loading"
      @save="handleSave"
    />

    <UploadExcelModal
      v-model:open="isUploadOpen"
      title="Import Jobs"
      description="Upload an Excel file to import job data."
      :expected-headers="['Job Code', 'Job Name', 'Job Type', 'Standard Time (seconds)', 'Active']"
      :loading="loading"
      @upload="handleUpload"
    />

    <ConfirmDialog
      v-model:open="confirm.open"
      :title="confirm.title"
      :description="confirm.description"
      confirm-label="Delete"
      :loading="loading"
      @confirm="confirm.action?.()"
    />
  </div>
</template>