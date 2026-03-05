<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { usePartStore } from '../../../stores/master-data/part.store'
import { useSupplierStore } from '../../../stores/master-data/supplier.store'
import { usePartColumns } from './composables/usePartColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { Parts } from '../../../types/master-data/parts'
import type { Row } from '@tanstack/table-core'
import partService from '../../../services/master-data/part.service'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import PartFilters from './components/PartFilters.vue'
import PartBulkActions from './components/PartBulkActions.vue'
import PartFormModal from './components/PartFormModal.vue'
import UploadExcelModal from '../../../components/UploadExcelModal.vue'

// Stores
const partStore = usePartStore()
const supplierStore = useSupplierStore()
const { parts, meta, loading } = storeToRefs(partStore)
const { dropdown: suppliers } = storeToRefs(supplierStore)
const { toastSuccess, toastError } = useAppToast()
const table = useTemplateRef('table')

// Resolve UI components
const uiComponents = {
  UCheckbox: resolveComponent('UCheckbox') as any,
  UButton: resolveComponent('UButton') as any,
  UDropdownMenu: resolveComponent('UDropdownMenu') as any
}

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Master Data' },
  { label: 'Parts' }
]

// State
const search = ref('')
const filters = reactive({
  supplier_id: undefined as number | undefined,
  part_type_code: undefined as string | undefined
})
const partTypes = ref<{ code: string; name: string }[]>([])

// Modal state — Form
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')

function createEmptyPart(): Partial<Parts> {
  return {
    id: undefined,
    part_number: '',
    part_name: '',
    part_type_code: '',
    part_category: '',
    supplier_id: undefined,
    price: 0,
    safety_stock: 0,
    lead_time_days: 0,
    model_name: '',
    model_code: '',
    generation: '',
    color: '',
    color_code: '',
    uom: '',
    package_name: '',
    package_code: ''
  }
}

const currentPart = reactive<Partial<Parts>>(createEmptyPart())

// Modal state — Upload
const isUploadModalOpen = ref(false)

// Confirm dialog
const confirmDialog = reactive({
  open: false,
  title: '',
  description: '',
  action: null as (() => Promise<void>) | null
})

// Table state
const rowSelection = ref({})

// Columns
const { columns } = usePartColumns({
  onEdit: openEditModal,
  onDelete: handleDelete
}, uiComponents)

// Computed
const selectedCount = computed((): number => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

// Data fetching
async function fetchData() {
  const params: Record<string, any> = {
    page: meta.value.page,
    limit: meta.value.limit,
    search: search.value
  }
  if (filters.supplier_id) params.supplier_id = filters.supplier_id
  if (filters.part_type_code) params.part_type_code = filters.part_type_code
  await partStore.fetchParts(params)
}

async function fetchPartTypes() {
  try {
    const res = await partService.ddTypes()
    if (res.data.status) {
      partTypes.value = res.data.data
    }
  } catch (e) {
    console.error('Error fetching part types:', e)
  }
}

// Download
async function handleDownload() {
  try {
    const params: Record<string, any> = { search: search.value }
    if (filters.supplier_id) params.supplier_id = filters.supplier_id
    if (filters.part_type_code) params.part_type_code = filters.part_type_code
    const blob = await partStore.downloadParts(params)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Parts_${new Date().getTime()}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    toastError(err)
  }
}

// Upload
async function handleUpload(file: File) {
  try {
    const res = await partStore.uploadPart(file)
    toastSuccess(res.message || 'Parts uploaded successfully')
    isUploadModalOpen.value = false
    fetchData()
  } catch (err) {
    toastError(err)
  }
}

// Modal handlers
function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentPart, createEmptyPart())
  isModalOpen.value = true
}

function openEditModal(part: Parts) {
  modalMode.value = 'edit'
  Object.assign(currentPart, {
    id: part.id,
    part_number: part.part_number,
    part_name: part.part_name,
    part_type_code: part.part_type_code,
    part_category: part.part_category,
    supplier_id: part.supplier_id,
    price: part.price,
    safety_stock: part.safety_stock,
    lead_time_days: part.lead_time_days,
    model_name: part.model_name,
    model_code: part.model_code,
    generation: part.generation,
    color: part.color,
    color_code: part.color_code,
    uom: part.uom,
    package_name: part.package_name,
    package_code: part.package_code
  })
  isModalOpen.value = true
}

async function handleSave(data: Partial<Parts>) {
  try {
    let message = ''
    if (modalMode.value === 'add') {
      const res = await partStore.createPart(data)
      message = res.message || 'Part created'
    } else {
      const res = await partStore.updatePart(currentPart.id!, data)
      message = res.message || 'Part updated'
    }
    toastSuccess(message)
    isModalOpen.value = false
    fetchData()
  } catch (err: any) {
    toastError(err)
  }
}

// Row actions
async function handleDelete(row: Parts) {
  confirmDialog.title = 'Delete Part'
  confirmDialog.description = `Are you sure you want to delete part "${row.part_name}"? This action cannot be undone.`
  confirmDialog.action = async () => {
    try {
      const res = await partStore.deletePart(row.id)
      toastSuccess(res.message || 'Part deleted')
      fetchData()
      confirmDialog.open = false
    } catch (err) {
      toastError(err)
      confirmDialog.open = false
    }
  }
  confirmDialog.open = true
}

async function handleBulkDelete() {
  const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().rows || []
  if (!selectedRows.length) return

  confirmDialog.title = 'Delete Multiple Parts'
  confirmDialog.description = `Are you sure you want to delete ${selectedRows.length} part(s)? This action cannot be undone.`
  confirmDialog.action = async () => {
    try {
      await Promise.all(selectedRows.map((row: Row<Parts>) => partStore.deletePart(row.original.id)))
      rowSelection.value = {}
      toastSuccess(`${selectedRows.length} parts deleted`)
      fetchData()
      confirmDialog.open = false
    } catch (err) {
      toastError(err)
      confirmDialog.open = false
    }
  }
  confirmDialog.open = true
}

// Filter handlers
function onUpdateSearch(value: string) {
  search.value = value
}

function onUpdateFilters(partial: Record<string, any>) {
  Object.assign(filters, partial)
}

// Watchers
const debouncedFetch = useDebounceFn(() => {
  meta.value.page = 1
  fetchData()
}, 300)

watch(search, () => debouncedFetch())
watch(filters, () => {
  meta.value.page = 1
  fetchData()
}, { deep: true })

// Lifecycle
onMounted(() => {
  fetchData()
  fetchPartTypes()
  supplierStore.fetchDropdown()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Part Management
      </h1>
    </div>

    <PartFilters
      :search="search"
      :filters="filters"
      :suppliers="suppliers"
      :part-types="partTypes"
      @update:search="onUpdateSearch"
      @update:filters="onUpdateFilters"
    />

    <div class="flex gap-2">
      <UButton
        icon="i-lucide-download"
        color="neutral"
        variant="ghost"
        label="Export"
        @click="handleDownload"
      />
      <UButton
        icon="i-lucide-upload"
        color="neutral"
        variant="ghost"
        label="Import"
        @click="isUploadModalOpen = true"
      />
      <UButton
        icon="i-lucide-plus"
        color="primary"
        variant="solid"
        label="Add Part"
        @click="openAddModal"
      />
    </div>

    <PartBulkActions
      :count="selectedCount"
      @delete="handleBulkDelete"
    />

    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      :data="parts"
      :columns="columns"
      :loading="loading"
      class="w-full"
    />

    <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
      <div class="text-sm text-muted">
        {{ selectedCount }} of {{ meta.total }} row(s) selected.
      </div>
      <UPagination
        v-model:page="meta.page"
        :total="meta.total"
        :items-per-page="meta.limit"
        @update:page="fetchData"
      />
    </div>

    <PartFormModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :part="currentPart"
      :suppliers="suppliers"
      :part-types="partTypes"
      :loading="loading"
      @save="handleSave"
    />

    <UploadExcelModal
      v-model:open="isUploadModalOpen"
      title="Upload Parts"
      description="Upload an Excel file to import part data."
      :loading="loading"
      @upload="handleUpload"
    />

    <ConfirmDialog
      v-model:open="confirmDialog.open"
      :title="confirmDialog.title"
      :description="confirmDialog.description"
      confirm-label="Delete"
      :loading="loading"
      @confirm="confirmDialog.action?.()"
    />
  </div>
</template>