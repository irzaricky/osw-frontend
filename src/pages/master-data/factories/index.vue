<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useFactoryStore } from '../../../stores/master-data/factory.store'
import { useFactoryColumns } from './composables/useFactoryColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { Factory } from '../../../types/master-data/factory'
import type { Row } from '@tanstack/table-core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import FactoryFilters from './components/FactoryFilters.vue'
import FactoryBulkActions from './components/FactoryBulkActions.vue'
import FactoryFormModal from './components/FactoryFormModal.vue'
import FactoryUploadModal from './components/FactoryUploadModal.vue'

// Store
const factoryStore = useFactoryStore()
const { factories, meta, loading } = storeToRefs(factoryStore)
const { toastSuccess, toastError } = useAppToast()
const table = useTemplateRef('table')

// Resolve components in setup context
const uiComponents = {
  UCheckbox: resolveComponent('UCheckbox') as any,
  UButton: resolveComponent('UButton') as any,
  UDropdownMenu: resolveComponent('UDropdownMenu') as any
}

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Master Data' },
  { label: 'Factories' }
]

// State
const search = ref('')

// Modal state — Form
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')

function createEmptyFactory(): Partial<Factory> {
  return {
    id: undefined,
    name: '',
    address: '',
    phone: '',
    maps_url: ''
  }
}

const currentFactory = reactive<Partial<Factory>>(createEmptyFactory())

// Modal state — Upload
const isUploadModalOpen = ref(false)

// Confirm dialog state
const confirmDialog = reactive({
  open: false,
  title: '',
  description: '',
  action: null as (() => Promise<void>) | null
})

// Table state
const rowSelection = ref({})

// Columns
const { columns } = useFactoryColumns({
  onEdit: openEditModal,
  onDelete: handleDelete
}, uiComponents)

// Computed
const selectedCount = computed((): number => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

// Data Fetching
async function fetchData() {
  const params: Record<string, any> = {
    page: meta.value.page,
    limit: meta.value.limit,
    search: search.value
  }
  await factoryStore.fetchFactories(params)
}

// Download
async function handleDownload() {
  try {
    const params: Record<string, any> = { search: search.value }
    const blob = await factoryStore.downloadFactories(params)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Factories_${new Date().getTime()}.xlsx`)
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
    const res = await factoryStore.uploadFactories(file)
    toastSuccess(res.message || 'Factories uploaded successfully')
    isUploadModalOpen.value = false
    fetchData()
  } catch (err) {
    toastError(err)
  }
}

// Modal Handlers
function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentFactory, createEmptyFactory())
  isModalOpen.value = true
}

function openEditModal(factory: Factory) {
  modalMode.value = 'edit'
  Object.assign(currentFactory, {
    id: factory.id,
    name: factory.name,
    address: factory.address ?? '',
    phone: factory.phone ?? '',
    maps_url: factory.maps_url ?? ''
  })
  isModalOpen.value = true
}

async function handleSave(data: Partial<Factory>) {
  try {
    let message = ''
    if (modalMode.value === 'add') {
      const res = await factoryStore.createFactory(data)
      message = res.message || 'Factory created'
    } else {
      const res = await factoryStore.updateFactory(currentFactory.id!, data)
      message = res.message || 'Factory updated'
    }
    toastSuccess(message)
    isModalOpen.value = false
    fetchData()
  } catch (err: any) {
    toastError(err)
  }
}

// Row Actions
async function handleDelete(row: Factory) {
  confirmDialog.title = 'Delete Factory'
  confirmDialog.description = `Are you sure you want to delete factory "${row.name}"? This action cannot be undone.`
  confirmDialog.action = async () => {
    try {
      const res = await factoryStore.deleteFactory(row.id)
      toastSuccess(res.message || 'Factory deleted')
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

  confirmDialog.title = 'Delete Multiple Factories'
  confirmDialog.description = `Are you sure you want to delete ${selectedRows.length} factory(s)? This action cannot be undone.`
  confirmDialog.action = async () => {
    try {
      await Promise.all(selectedRows.map((row: Row<Factory>) => factoryStore.deleteFactory(row.original.id)))
      rowSelection.value = {}
      toastSuccess(`${selectedRows.length} factories deleted`)
      fetchData()
      confirmDialog.open = false
    } catch (err) {
      toastError(err)
      confirmDialog.open = false
    }
  }
  confirmDialog.open = true
}

// Filter Handlers
function onUpdateSearch(value: string) {
  search.value = value
}

// Watchers
const debouncedFetch = useDebounceFn(() => {
  meta.value.page = 1
  fetchData()
}, 300)

watch(search, () => debouncedFetch())

// Lifecycle
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Breadcrumbs -->
    <Breadcrumbs :items="breadcrumbItems" />

    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Factory Management
      </h1>
    </div>

    <div class="flex justify-between items-center gap-4">
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
          label="Add Factory"
          @click="openAddModal"
        />
      </div>

      <FactoryFilters
        :search="search"
        @update:search="onUpdateSearch"
      />
    </div>

    <!-- Bulk Actions -->
    <FactoryBulkActions
      :count="selectedCount"
      @delete="handleBulkDelete"
    />

    <!-- Table -->
    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      :data="factories"
      :columns="columns"
      :loading="loading"
      class="w-full"
    />

    <!-- Pagination -->
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

    <!-- Form Modal -->
    <FactoryFormModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :factory="currentFactory"
      :loading="loading"
      @save="handleSave"
    />

    <!-- Upload Modal -->
    <FactoryUploadModal
      v-model:open="isUploadModalOpen"
      :loading="loading"
      @upload="handleUpload"
    />

    <!-- Confirm Dialog -->
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