<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useStationStore } from '../../../stores/master-data/station.store'
import { useLineStore } from '../../../stores/master-data/line.store'
import { useJobStore } from '../../../stores/master-data/job.store'
import { useStationColumns } from './composables/useStationColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { Station, StationJob } from '../../../types/master-data/station'
import type { Row } from '@tanstack/table-core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import UploadExcelModal from '../../../components/UploadExcelModal.vue'
import StationFilters from './components/StationFilters.vue'
import StationBulkActions from './components/StationBulkActions.vue'
import StationFormModal from './components/StationFormModal.vue'
import StationJobsPanel from './components/StationJobsPanel.vue'

const stationStore = useStationStore()
const lineStore = useLineStore()
const jobStore = useJobStore()

const { stations, stationTypes, stationJobs, meta, loading, loadingJobs } = storeToRefs(stationStore)
const { dropdown: lines } = storeToRefs(lineStore)
const { dropdown: jobDropdown } = storeToRefs(jobStore)
const { toastSuccess, toastError } = useAppToast()

const table = useTemplateRef('table')

const ui = {
  UCheckbox: resolveComponent('UCheckbox') as any,
  UButton: resolveComponent('UButton') as any,
  UDropdownMenu: resolveComponent('UDropdownMenu') as any,
  UBadge: resolveComponent('UBadge') as any,
}

const { columns } = useStationColumns({ onEdit: openEditModal, onDelete: confirmDelete }, ui)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Master Data' },
  { label: 'Stations' },
]

const search = ref('')
const filters = reactive({
  line_id: undefined as number | undefined,
  station_type_id: undefined as number | undefined,
  status: undefined as boolean | undefined,
})

const rowSelection = ref({})
const expanded = ref<Record<string, boolean>>({})
const expandedStationId = ref<number | null>(null)

const selectedCount = computed((): number => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const isUploadOpen = ref(false)

const emptyStation = (): Partial<Station> => ({
  station_code: '', name: '', line_id: undefined,
  station_type_id: undefined, sequence: 0, status: true,
})

const currentStation = reactive<Partial<Station>>(emptyStation())

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
  if (filters.line_id) params.line_id = filters.line_id
  if (filters.station_type_id) params.station_type_id = filters.station_type_id
  if (filters.status !== undefined) params.status = filters.status
  await stationStore.fetchStations(params)
}

const debouncedSearch = useDebounceFn(() => { meta.value.page = 1; fetchData() }, 300)

watch(search, debouncedSearch)
watch(filters, () => { meta.value.page = 1; fetchData() }, { deep: true })

watch(expanded, (val) => {
  const keys = Object.keys(val).filter(k => val[k])
  if (!keys.length) { expandedStationId.value = null; return }
  const idx = parseInt(keys[0])
  const station = stations.value[idx]
  if (station && station.id !== expandedStationId.value) {
    expandedStationId.value = station.id
    stationStore.fetchStationJobs(station.id)
  }
}, { deep: true })

async function handleDownload() {
  try {
    const params: Record<string, any> = { search: search.value }
    if (filters.line_id) params.line_id = filters.line_id
    if (filters.station_type_id) params.station_type_id = filters.station_type_id
    const blob = await stationStore.downloadStations(params)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Stations_${Date.now()}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) { toastError(e) }
}

async function handleUpload(file: File) {
  try {
    const res = await stationStore.uploadStations(file)
    toastSuccess(res.message || 'Upload successful')
    isUploadOpen.value = false
    fetchData()
  } catch (e) { toastError(e) }
}

function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentStation, emptyStation())
  isModalOpen.value = true
}

function openEditModal(station: Station) {
  modalMode.value = 'edit'
  Object.assign(currentStation, {
    id: station.id,
    station_code: station.station_code,
    name: station.name,
    line_id: station.line_id,
    station_type_id: station.station_type_id,
    sequence: station.sequence,
    status: station.status,
  })
  isModalOpen.value = true
}

async function handleSave(data: Partial<Station>) {
  try {
    let res
    if (modalMode.value === 'add') {
      res = await stationStore.createStation(data)
    } else {
      res = await stationStore.updateStation(currentStation.id!, data)
    }
    toastSuccess(res.message || 'Saved')
    isModalOpen.value = false
    fetchData()
  } catch (e) { toastError(e) }
}

function confirmDelete(station: Station) {
  confirm.title = 'Delete Station'
  confirm.description = `Are you sure you want to delete station "${station.name}"? This action cannot be undone.`
  confirm.action = async () => {
    try {
      const res = await stationStore.deleteStation(station.id)
      toastSuccess(res.message || 'Station deleted')
      fetchData()
      confirm.open = false
    } catch (e) { toastError(e); confirm.open = false }
  }
  confirm.open = true
}

function confirmBulkDelete() {
  const rows = table.value?.tableApi?.getFilteredSelectedRowModel().rows || []
  if (!rows.length) return
  confirm.title = 'Delete Selected'
  confirm.description = `Are you sure you want to delete ${rows.length} station(s)? This action cannot be undone.`
  confirm.action = async () => {
    try {
      await Promise.all(rows.map((r: Row<Station>) => stationStore.deleteStation(r.original.id)))
      toastSuccess(`${rows.length} stations deleted`)
      rowSelection.value = {}
      fetchData()
      confirm.open = false
    } catch (e) { toastError(e); confirm.open = false }
  }
  confirm.open = true
}

async function handleAddJob(data: Partial<StationJob>) {
  if (!expandedStationId.value) return
  try {
    const res = await stationStore.addStationJob(expandedStationId.value, data)
    toastSuccess(res.message || 'Job assigned')
    stationStore.fetchStationJobs(expandedStationId.value)
  } catch (e) { toastError(e) }
}

async function handleUpdateJob(id: number, data: Partial<StationJob>) {
  if (!expandedStationId.value) return
  try {
    const res = await stationStore.updateStationJob(expandedStationId.value, id, data)
    toastSuccess(res.message || 'Updated')
    stationStore.fetchStationJobs(expandedStationId.value)
  } catch (e) { toastError(e) }
}

async function handleDeleteJob(id: number) {
  if (!expandedStationId.value) return
  try {
    const res = await stationStore.deleteStationJob(expandedStationId.value, id)
    toastSuccess(res.message || 'Removed')
    stationStore.fetchStationJobs(expandedStationId.value)
  } catch (e) { toastError(e) }
}

onMounted(() => {
  fetchData()
  stationStore.fetchStationTypes()
  lineStore.fetchDropdown()
  jobStore.fetchDropdown()
})
</script>

<template>
  <div class="p-6 space-y-5">
    <Breadcrumbs :items="breadcrumbItems" />

    <h1 class="text-2xl font-bold">Station Management</h1>

    <StationFilters
      :search="search"
      :filters="filters"
      :lines="lines"
      :station-types="stationTypes"
      @update:search="search = $event"
      @update:filters="Object.assign(filters, $event)"
    />

    <!-- Toolbar -->
    <div class="flex items-center gap-2">
      <UButton icon="i-lucide-download" color="neutral" variant="ghost" label="Export" @click="handleDownload" />
      <UButton icon="i-lucide-upload" color="neutral" variant="ghost" label="Import" @click="isUploadOpen = true" />
      <UButton icon="i-lucide-plus" color="primary" label="Add Station" @click="openAddModal" />
    </div>

    <!-- Bulk Actions -->
    <StationBulkActions
      :count="selectedCount"
      @delete="confirmBulkDelete"
    />

    <!-- Table -->
    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      v-model:expanded="expanded"
      :data="stations"
      :columns="columns"
      :loading="loading"
      class="w-full"
    >
      <template #expanded="{ row }">
        <StationJobsPanel
          :station="row.original"
          :station-jobs="expandedStationId === row.original.id ? stationJobs : []"
          :job-dropdown="jobDropdown as any"
          :loading="loadingJobs"
          @add="handleAddJob"
          @update="handleUpdateJob"
          @delete="handleDeleteJob"
        />
      </template>
    </UTable>

    <!-- Pagination -->
    <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
      <div class="text-sm text-muted">
        {{ meta.total === 0 ? '0' : ((meta.page - 1) * meta.limit) + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }} of {{ meta.total }} row(s)
      </div>
      <UPagination
        v-model:page="meta.page"
        :total="meta.total"
        :items-per-page="meta.limit"
        @update:page="fetchData"
      />
    </div>

    <!-- Modals -->
    <StationFormModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :station="currentStation"
      :lines="lines"
      :station-types="stationTypes"
      :loading="loading"
      @save="handleSave"
    />

    <UploadExcelModal
      v-model:open="isUploadOpen"
      title="Import Stations"
      description="Upload an Excel file to import station data."
      :expected-headers="['Station Code', 'Station Name', 'Line', 'Station Type', 'Sequence', 'Status']"
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