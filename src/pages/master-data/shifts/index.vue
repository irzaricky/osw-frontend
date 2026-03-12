<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useShiftStore } from '../../../stores/master-data/shift.store'
import { useShiftColumns } from './composables/useShiftColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { Shift } from '../../../types/master-data/shift'
import type { Row } from '@tanstack/table-core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import UploadExcelModal from '../../../components/UploadExcelModal.vue'
import ShiftFilters from './components/ShiftFilters.vue'
import ShiftBulkActions from './components/ShiftBulkActions.vue'
import ShiftFormModal from './components/ShiftFormModal.vue'

const shiftStore = useShiftStore()

const { shifts, shiftTypes, shiftCategories, meta, loading } = storeToRefs(shiftStore)
const { toastSuccess, toastError } = useAppToast()

const table = useTemplateRef('table')

const ui = {
  UCheckbox: resolveComponent('UCheckbox') as any,
  UButton: resolveComponent('UButton') as any,
  UDropdownMenu: resolveComponent('UDropdownMenu') as any,
  UBadge: resolveComponent('UBadge') as any,
}

const { columns } = useShiftColumns({ onEdit: openEditModal, onDelete: confirmDelete }, ui)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Master Data' },
  { label: 'Shifts' },
]

const search = ref('')
const filters = reactive({
  type: undefined as string | undefined,
  category: undefined as string | undefined,
  active: undefined as boolean | undefined,
})

const rowSelection = ref({})

const selectedCount = computed((): number => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const isUploadOpen = ref(false)

const emptyShift = (): Partial<Shift> => ({
  name: '',
  shift_number: 1,
  type: undefined,
  start_time: '',
  end_time: '',
  category: undefined,
  description: '',
  active: true,
})

const currentShift = reactive<Partial<Shift>>(emptyShift())

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
  if (filters.type) params.type = filters.type
  if (filters.category) params.category = filters.category
  if (filters.active !== undefined) params.active = filters.active
  await shiftStore.fetchShifts(params)
}

const debouncedSearch = useDebounceFn(() => { meta.value.page = 1; fetchData() }, 300)

watch(search, debouncedSearch)
watch(filters, () => { meta.value.page = 1; fetchData() }, { deep: true })

async function handleDownload() {
  try {
    const params: Record<string, any> = { search: search.value }
    if (filters.type) params.type = filters.type
    if (filters.category) params.category = filters.category
    const blob = await shiftStore.downloadShifts(params)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Shifts_${Date.now()}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) { toastError(e) }
}

async function handleUpload(file: File) {
  try {
    const res = await shiftStore.uploadShifts(file)
    toastSuccess(res.message || 'Upload successful')
    isUploadOpen.value = false
    fetchData()
  } catch (e) { toastError(e) }
}

function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentShift, emptyShift())
  isModalOpen.value = true
}

function openEditModal(shift: Shift) {
  modalMode.value = 'edit'
  Object.assign(currentShift, {
    id: shift.id,
    name: shift.name,
    shift_number: shift.shift_number,
    type: shift.type,
    start_time: shift.start_time,
    end_time: shift.end_time,
    category: shift.category,
    description: shift.description,
    active: shift.active,
  })
  isModalOpen.value = true
}

async function handleSave(data: Partial<Shift>) {
  try {
    let res
    if (modalMode.value === 'add') {
      res = await shiftStore.createShift(data)
    } else {
      res = await shiftStore.updateShift(currentShift.id!, data)
    }
    toastSuccess(res.message || 'Saved')
    isModalOpen.value = false
    fetchData()
  } catch (e) { toastError(e) }
}

function confirmDelete(shift: Shift) {
  confirm.title = 'Delete Shift'
  confirm.description = `Are you sure you want to delete shift "${shift.name}"? This action cannot be undone.`
  confirm.action = async () => {
    try {
      const res = await shiftStore.deleteShift(shift.id)
      toastSuccess(res.message || 'Shift deleted')
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
  confirm.description = `Are you sure you want to delete ${rows.length} shift(s)? This action cannot be undone.`
  confirm.action = async () => {
    try {
      await Promise.all(rows.map((r: Row<Shift>) => shiftStore.deleteShift(r.original.id)))
      toastSuccess(`${rows.length} shifts deleted`)
      rowSelection.value = {}
      fetchData()
      confirm.open = false
    } catch (e) { toastError(e); confirm.open = false }
  }
  confirm.open = true
}

onMounted(() => {
  fetchData()
  shiftStore.fetchShiftTypes()
  shiftStore.fetchShiftCategories()
})
</script>

<template>
  <div class="p-6 space-y-5">
    <Breadcrumbs :items="breadcrumbItems" />

    <h1 class="text-2xl font-bold">Shift Management</h1>

    <ShiftFilters
      :search="search"
      :filters="filters"
      :shift-types="shiftTypes"
      :shift-categories="shiftCategories"
      @update:search="search = $event"
      @update:filters="Object.assign(filters, $event)"
    />

    <!-- Toolbar -->
    <div class="flex items-center gap-2">
      <UButton icon="i-lucide-download" color="neutral" variant="ghost" label="Export" @click="handleDownload" />
      <UButton icon="i-lucide-upload" color="neutral" variant="ghost" label="Import" @click="isUploadOpen = true" />
      <UButton icon="i-lucide-plus" color="primary" label="Add Shift" @click="openAddModal" />
    </div>

    <!-- Bulk Actions -->
    <ShiftBulkActions
      :count="selectedCount"
      @delete="confirmBulkDelete"
    />

    <!-- Table -->
    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      :data="shifts"
      :columns="columns"
      :loading="loading"
      class="w-full"
    />

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
    <ShiftFormModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :shift="currentShift"
      :shift-types="shiftTypes"
      :shift-categories="shiftCategories"
      :loading="loading"
      @save="handleSave"
    />

    <UploadExcelModal
      v-model:open="isUploadOpen"
      title="Import Shifts"
      description="Upload an Excel file to import shift data."
      :expected-headers="['Name', 'Shift Number', 'Type', 'Start Time', 'End Time', 'Category', 'Description', 'Active']"
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