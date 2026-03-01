<script setup lang="ts">
import { ref, reactive, computed, onMounted, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { useStationStore } from '../../../../../stores/master-data/station.store'
import { useJobStore } from '../../../../../stores/master-data/job.store'
import { useStationJobColumns } from './composables/useStationJobColumns'
import { useAppToast } from '../../../../../composables/useAppToast'
import type { Station, StationJob } from '../../../../../types/master-data/station'
import type { Row } from '@tanstack/table-core'

import Breadcrumbs from '../../../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../../../components/ConfirmDialog.vue'
import StationJobBulkActions from './components/StationJobBulkActions.vue'
import StationJobFormModal from './components/StationJobFromModal.vue'

const router = useRouter()
const route = useRoute()
const stationId = computed(() => Number(route.params.id))

const stationStore = useStationStore()
const jobStore = useJobStore()

const { stationJobs, loadingJobs } = storeToRefs(stationStore)
const { dropdown: jobDropdown } = storeToRefs(jobStore)
const { toastSuccess, toastError } = useAppToast()

// ─── Station info ─────────────────────────────────────────────────
const station = ref<Station | null>(null)

// ─── Client-side pagination ───────────────────────────────────────
const page = ref(1)
const limit = ref(10)

const total = computed(() => stationJobs.value.length)

const paginatedJobs = computed(() => {
  const start = (page.value - 1) * limit.value
  return stationJobs.value.slice(start, start + limit.value)
})

const rangeStart = computed(() => total.value === 0 ? 0 : (page.value - 1) * limit.value + 1)
const rangeEnd = computed(() => Math.min(page.value * limit.value, total.value))

// ─── Table ────────────────────────────────────────────────────────
const table = useTemplateRef('table')

const ui = {
  UCheckbox: resolveComponent('UCheckbox') as any,
  UButton: resolveComponent('UButton') as any,
  UDropdownMenu: resolveComponent('UDropdownMenu') as any,
  UBadge: resolveComponent('UBadge') as any,
}

const { columns } = useStationJobColumns({ onEdit: openEditModal, onDelete: confirmDelete }, ui)

const breadcrumbItems = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Master Data' },
  { label: 'Stations', to: '/master-data/stations' },
  { label: station.value?.name ?? `Station #${stationId.value}` },
  { label: 'Jobs' },
])

const rowSelection = ref({})

const selectedCount = computed((): number => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

// ─── Modal state ──────────────────────────────────────────────────
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')

const emptyStationJob = (): Partial<StationJob> => ({
  job_id: undefined, sequence: 0, mandatory: true, active: true,
})

const currentStationJob = reactive<Partial<StationJob>>(emptyStationJob())

// ─── Confirm dialog ───────────────────────────────────────────────
const confirm = reactive({
  open: false,
  title: '',
  description: '',
  action: null as (() => Promise<void>) | null,
})

// ─── Fetch ────────────────────────────────────────────────────────
async function fetchJobs() {
  await stationStore.fetchStationJobs(stationId.value)
  page.value = 1
}

// ─── CRUD ─────────────────────────────────────────────────────────
function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentStationJob, emptyStationJob())
  isModalOpen.value = true
}

function openEditModal(sj: StationJob) {
  modalMode.value = 'edit'
  Object.assign(currentStationJob, {
    id: sj.id,
    job_id: sj.job_id,
    sequence: sj.sequence,
    mandatory: sj.mandatory,
    active: sj.active,
  })
  isModalOpen.value = true
}

async function handleSave(data: Partial<StationJob>) {
  try {
    let res
    if (modalMode.value === 'add') {
      res = await stationStore.addStationJob(stationId.value, data)
    } else {
      res = await stationStore.updateStationJob(stationId.value, currentStationJob.id!, data)
    }
    toastSuccess(res.message || 'Saved')
    isModalOpen.value = false
    fetchJobs()
  } catch (e) { toastError(e) }
}

function confirmDelete(sj: StationJob) {
  confirm.title = 'Remove Job'
  confirm.description = `Are you sure you want to remove "${sj.job?.name ?? 'this job'}" from this station? This action cannot be undone.`
  confirm.action = async () => {
    try {
      const res = await stationStore.deleteStationJob(stationId.value, sj.id)
      toastSuccess(res.message || 'Job removed')
      fetchJobs()
      confirm.open = false
    } catch (e) { toastError(e); confirm.open = false }
  }
  confirm.open = true
}

function confirmBulkDelete() {
  const rows = table.value?.tableApi?.getFilteredSelectedRowModel().rows || []
  if (!rows.length) return
  confirm.title = 'Remove Selected'
  confirm.description = `Are you sure you want to remove ${rows.length} job(s) from this station? This action cannot be undone.`
  confirm.action = async () => {
    try {
      await Promise.all(
        rows.map((r: Row<StationJob>) => stationStore.deleteStationJob(stationId.value, r.original.id))
      )
      toastSuccess(`${rows.length} jobs removed`)
      rowSelection.value = {}
      fetchJobs()
      confirm.open = false
    } catch (e) { toastError(e); confirm.open = false }
  }
  confirm.open = true
}

// ─── Init ─────────────────────────────────────────────────────────
onMounted(async () => {
  let found = stationStore.stations.find(s => s.id === stationId.value)
  if (!found) {
    await stationStore.fetchStations({ page: 1, limit: 1000 })
    found = stationStore.stations.find(s => s.id === stationId.value)
  }
  station.value = found ?? null

  fetchJobs()
  jobStore.fetchDropdown()
})
</script>

<template>
  <div class="p-6 space-y-5">
    <Breadcrumbs :items="breadcrumbItems" />

    <!-- Back + Title -->
    <div class="flex items-center gap-3">
      <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" @click="router.back()" />
      <h1 class="text-2xl font-bold">Job Assignments</h1>
    </div>

    <!-- Station info header -->
    <div v-if="station" class="rounded-lg border border-default bg-elevated p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <p class="text-xs text-muted mb-1">Station Code</p>
        <p class="text-sm font-semibold">{{ station.station_code }}</p>
      </div>
      <div>
        <p class="text-xs text-muted mb-1">Name</p>
        <p class="text-sm font-semibold">{{ station.name }}</p>
      </div>
      <div>
        <p class="text-xs text-muted mb-1">Line</p>
        <p class="text-sm font-semibold">{{ station.line?.name ?? '-' }}</p>
      </div>
      <div>
        <p class="text-xs text-muted mb-1">Station Type</p>
        <p class="text-sm font-semibold">{{ station.station_type?.name ?? '-' }}</p>
      </div>
      <div>
        <p class="text-xs text-muted mb-1">Sequence</p>
        <p class="text-sm font-semibold">{{ station.sequence }}</p>
      </div>
      <div>
        <p class="text-xs text-muted mb-1">Status</p>
        <UBadge
          :label="station.status ? 'Active' : 'Inactive'"
          :color="station.status ? 'success' : 'neutral'"
          variant="soft"
        />
      </div>
      <div>
        <p class="text-xs text-muted mb-1">Total Jobs</p>
        <p class="text-sm font-semibold">{{ stationJobs.length }}</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center gap-2">
      <UButton icon="i-lucide-plus" color="primary" label="Assign Job" class="ml-auto" @click="openAddModal" />
    </div>

    <!-- Bulk Actions -->
    <StationJobBulkActions
      :count="selectedCount"
      @delete="confirmBulkDelete"
    />

    <!-- Table -->
    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      :data="paginatedJobs"
      :columns="columns"
      :loading="loadingJobs"
      class="w-full"
    />

    <!-- Footer -->
    <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
      <div class="text-sm text-muted">
        {{ rangeStart }}–{{ rangeEnd }} of {{ total }} row(s)
      </div>
      <UPagination
        v-model:page="page"
        :total="total"
        :items-per-page="limit"
      />
    </div>

    <!-- Modals -->
    <StationJobFormModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :station-job="currentStationJob"
      :job-dropdown="jobDropdown as any"
      :loading="loadingJobs"
      @save="handleSave"
    />

    <ConfirmDialog
      v-model:open="confirm.open"
      :title="confirm.title"
      :description="confirm.description"
      confirm-label="Remove"
      :loading="loadingJobs"
      @confirm="confirm.action?.()"
    />
  </div>
</template>