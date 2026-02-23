<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useLineStore } from '../../../stores/master-data/line.store'
import { useFactoryStore } from '../../../stores/master-data/factory.store'
import { useLineColumns } from './composables/useLineColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { Line } from '../../../types/master-data/line'
import type { Row } from '@tanstack/table-core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import LineFilters from './components/LineFilters.vue'
import LineBulkActions from './components/LineBulkActions.vue'
import LineFormModal from './components/LineFormModal.vue'
import UploadExcelModal from '../../../components/UploadExcelModal.vue'

// Stores
const lineStore = useLineStore()
const factoryStore = useFactoryStore()
const { lines, meta, loading } = storeToRefs(lineStore)
const { dropdown: factories } = storeToRefs(factoryStore)
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
  { label: 'Lines' }
]

// State
const search = ref('')
const filters = reactive({
  factory_id: undefined as number | undefined
})

// Modal state — Form
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')

function createEmptyLine(): Partial<Line> {
  return {
    id: undefined,
    line_code: '',
    name: '',
    factory_id: undefined,
    sequence: 0
  }
}

const currentLine = reactive<Partial<Line>>(createEmptyLine())

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
const { columns } = useLineColumns({
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
  if (filters.factory_id) params.factory_id = filters.factory_id
  await lineStore.fetchLines(params)
}

// Download
async function handleDownload() {
  try {
    const params: Record<string, any> = { search: search.value }
    if (filters.factory_id) params.factory_id = filters.factory_id
    const blob = await lineStore.downloadLines(params)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Lines_${new Date().getTime()}.xlsx`)
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
    const res = await lineStore.uploadLines(file)
    toastSuccess(res.message || 'Lines uploaded successfully')
    isUploadModalOpen.value = false
    fetchData()
  } catch (err) {
    toastError(err)
  }
}

// Modal handlers
function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentLine, createEmptyLine())
  isModalOpen.value = true
}

function openEditModal(line: Line) {
  modalMode.value = 'edit'
  Object.assign(currentLine, {
    id: line.id,
    line_code: line.line_code,
    name: line.name,
    factory_id: line.factory_id,
    sequence: line.sequence
  })
  isModalOpen.value = true
}

async function handleSave(data: Partial<Line>) {
  try {
    let message = ''
    if (modalMode.value === 'add') {
      const res = await lineStore.createLine(data)
      message = res.message || 'Line created'
    } else {
      const res = await lineStore.updateLine(currentLine.id!, data)
      message = res.message || 'Line updated'
    }
    toastSuccess(message)
    isModalOpen.value = false
    fetchData()
  } catch (err: any) {
    toastError(err)
  }
}

// Row actions
async function handleDelete(row: Line) {
  confirmDialog.title = 'Delete Line'
  confirmDialog.description = `Are you sure you want to delete line "${row.name}"? This action cannot be undone.`
  confirmDialog.action = async () => {
    try {
      const res = await lineStore.deleteLine(row.id)
      toastSuccess(res.message || 'Line deleted')
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

  confirmDialog.title = 'Delete Multiple Lines'
  confirmDialog.description = `Are you sure you want to delete ${selectedRows.length} line(s)? This action cannot be undone.`
  confirmDialog.action = async () => {
    try {
      await Promise.all(selectedRows.map((row: Row<Line>) => lineStore.deleteLine(row.original.id)))
      rowSelection.value = {}
      toastSuccess(`${selectedRows.length} lines deleted`)
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
  factoryStore.fetchDropdown()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Line Management
      </h1>
    </div>

    <LineFilters
      :search="search"
      :filters="filters"
      :factories="factories"
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
        label="Add Line"
        @click="openAddModal"
      />
    </div>

    <LineBulkActions
      :count="selectedCount"
      @delete="handleBulkDelete"
    />

    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      :data="lines"
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

    <LineFormModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :line="currentLine"
      :factories="factories"
      :loading="loading"
      @save="handleSave"
    />

    <UploadExcelModal
      v-model:open="isUploadModalOpen"
      title="Upload Lines"
      description="Upload an Excel file to import line data."
      :expected-headers="['Line Code', 'Line Name', 'Factory Name', 'Sequence']"
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