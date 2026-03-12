<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useShiftCalendarStore } from '../../../stores/master-data/shift-calendar.store'
import { useShiftStore } from '../../../stores/master-data/shift.store'
import { useLineStore } from '../../../stores/master-data/line.store'
import { useShiftCalendarColumns } from './composables/useShiftCalendarColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { ShiftCalendar } from '../../../types/master-data/shift-calendar'
import type { Row } from '@tanstack/table-core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import UploadExcelModal from '../../../components/UploadExcelModal.vue'
import ShiftCalendarFilters from './components/ShiftCalendarFilters.vue'
import ShiftCalendarBulkActions from './components/ShiftCalendarBulkActions.vue'
import ShiftCalendarFormModal from './components/ShiftCalendarFormModal.vue'

const shiftCalendarStore = useShiftCalendarStore()
const shiftStore = useShiftStore()
const lineStore = useLineStore()

const { shiftCalendars, calendarTypes, meta, loading } = storeToRefs(shiftCalendarStore)
const { dropdown: shiftDropdown } = storeToRefs(shiftStore)
const { dropdown: lineDropdown } = storeToRefs(lineStore)
const { toastSuccess, toastError } = useAppToast()

const table = useTemplateRef('table')

const ui = {
  UCheckbox: resolveComponent('UCheckbox') as any,
  UButton: resolveComponent('UButton') as any,
  UDropdownMenu: resolveComponent('UDropdownMenu') as any,
  UBadge: resolveComponent('UBadge') as any,
}

const { columns } = useShiftCalendarColumns({ onEdit: openEditModal, onDelete: confirmDelete }, ui)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Master Data' },
  { label: 'Shift Calendars' },
]

const search = ref('')
const filters = reactive({
  shift_id: undefined as number | undefined,
  line_id: undefined as number | undefined,
  ref_type_calendar_id: undefined as number | undefined,
  active: undefined as boolean | undefined,
})

const rowSelection = ref({})

const selectedCount = computed((): number => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const isUploadOpen = ref(false)

const emptyCalendar = (): Partial<ShiftCalendar> => ({
  shift_id: undefined,
  line_id: undefined,
  ref_type_calendar_id: undefined,
  start_date: '',
  end_date: '',
  date_event: '',
  active: true,
})

const currentCalendar = reactive<Partial<ShiftCalendar>>(emptyCalendar())

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
  if (filters.shift_id) params.shift_id = filters.shift_id
  if (filters.line_id) params.line_id = filters.line_id
  if (filters.ref_type_calendar_id) params.ref_type_calendar_id = filters.ref_type_calendar_id
  if (filters.active !== undefined) params.active = filters.active
  await shiftCalendarStore.fetchShiftCalendars(params)
}

const debouncedSearch = useDebounceFn(() => { meta.value.page = 1; fetchData() }, 300)

watch(search, debouncedSearch)
watch(filters, () => { meta.value.page = 1; fetchData() }, { deep: true })

async function handleDownload() {
  try {
    const params: Record<string, any> = { search: search.value }
    if (filters.shift_id) params.shift_id = filters.shift_id
    if (filters.line_id) params.line_id = filters.line_id
    if (filters.ref_type_calendar_id) params.ref_type_calendar_id = filters.ref_type_calendar_id
    const blob = await shiftCalendarStore.downloadShiftCalendars(params)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ShiftCalendars_${Date.now()}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) { toastError(e) }
}

async function handleUpload(file: File) {
  try {
    const res = await shiftCalendarStore.uploadShiftCalendars(file)
    toastSuccess(res.message || 'Upload successful')
    isUploadOpen.value = false
    fetchData()
  } catch (e) { toastError(e) }
}

function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentCalendar, emptyCalendar())
  isModalOpen.value = true
}

function openEditModal(sc: ShiftCalendar) {
  modalMode.value = 'edit'
  Object.assign(currentCalendar, {
    id: sc.id,
    shift_id: sc.shift_id,
    line_id: sc.line_id,
    ref_type_calendar_id: sc.ref_type_calendar_id,
    start_date: sc.start_date,
    end_date: sc.end_date,
    date_event: sc.date_event,
    active: sc.active,
  })
  isModalOpen.value = true
}

async function handleSave(data: Partial<ShiftCalendar>) {
  try {
    let res
    if (modalMode.value === 'add') {
      res = await shiftCalendarStore.createShiftCalendar(data)
    } else {
      res = await shiftCalendarStore.updateShiftCalendar(currentCalendar.id!, data)
    }
    toastSuccess(res.message || 'Saved')
    isModalOpen.value = false
    fetchData()
  } catch (e) { toastError(e) }
}

function confirmDelete(sc: ShiftCalendar) {
  confirm.title = 'Delete Shift Calendar'
  confirm.description = `Are you sure you want to delete "${sc.date_event}"? This action cannot be undone.`
  confirm.action = async () => {
    try {
      const res = await shiftCalendarStore.deleteShiftCalendar(sc.id)
      toastSuccess(res.message || 'Deleted')
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
  confirm.description = `Are you sure you want to delete ${rows.length} calendar entr${rows.length > 1 ? 'ies' : 'y'}? This action cannot be undone.`
  confirm.action = async () => {
    try {
      await Promise.all(rows.map((r: Row<ShiftCalendar>) => shiftCalendarStore.deleteShiftCalendar(r.original.id)))
      toastSuccess(`${rows.length} entries deleted`)
      rowSelection.value = {}
      fetchData()
      confirm.open = false
    } catch (e) { toastError(e); confirm.open = false }
  }
  confirm.open = true
}

onMounted(() => {
  fetchData()
  shiftCalendarStore.fetchCalendarTypes()
  shiftStore.fetchDropdown()
  lineStore.fetchDropdown()
})
</script>

<template>
  <div class="p-6 space-y-5">
    <Breadcrumbs :items="breadcrumbItems" />

    <h1 class="text-2xl font-bold">Shift Calendar Management</h1>

    <ShiftCalendarFilters
      :search="search"
      :filters="filters"
      :shift-dropdown="shiftDropdown as any"
      :line-dropdown="lineDropdown as any"
      :calendar-types="calendarTypes"
      @update:search="search = $event"
      @update:filters="Object.assign(filters, $event)"
    />

    <!-- Toolbar -->
    <div class="flex items-center gap-2">
      <UButton icon="i-lucide-download" color="neutral" variant="ghost" label="Export" @click="handleDownload" />
      <UButton icon="i-lucide-upload" color="neutral" variant="ghost" label="Import" @click="isUploadOpen = true" />
      <UButton icon="i-lucide-plus" color="primary" label="Add Shift Calendar" @click="openAddModal" />
    </div>

    <!-- Bulk Actions -->
    <ShiftCalendarBulkActions
      :count="selectedCount"
      @delete="confirmBulkDelete"
    />

    <!-- Table -->
    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      :data="shiftCalendars"
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
    <ShiftCalendarFormModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :shift-calendar="currentCalendar"
      :shift-dropdown="shiftDropdown as any"
      :line-dropdown="lineDropdown as any"
      :calendar-types="calendarTypes"
      :loading="loading"
      @save="handleSave"
    />

    <UploadExcelModal
      v-model:open="isUploadOpen"
      title="Import Shift Calendars"
      description="Upload an Excel file to import shift calendar data."
      :expected-headers="['Shift', 'Line', 'Calendar Type', 'Event Name', 'Start Date', 'End Date', 'Active']"
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