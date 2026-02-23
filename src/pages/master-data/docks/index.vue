<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useDockStore } from '../../../stores/master-data/dock.store'
import { useDockDropdowns } from './composables/useDockDropdowns'
import { useDockColumns } from './composables/useDockColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { Dock } from '../../../types/master-data/dock'
import type { Row } from '@tanstack/table-core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import DockFilters from './components/DockFilters.vue'
import DockBulkActions from './components/DockBulkActions.vue'
import DockFormModal from './components/DockFormModal.vue'

// Store
const dockStore = useDockStore()
const { docks, meta, loading } = storeToRefs(dockStore)
const { toastSuccess, toastError } = useAppToast()
const table = useTemplateRef<any>('table')

const uiComponents = {
  UCheckbox: resolveComponent('UCheckbox'),
  UBadge: resolveComponent('UBadge'),
  UButton: resolveComponent('UButton'),
  UDropdownMenu: resolveComponent('UDropdownMenu')
}

const pagination = computed(() => ({
  page: meta.value.page,
  limit: meta.value.limit
}))

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Master Data' },
  { label: 'Docks' }
]

// State
const search = ref('')
const filters = reactive({
  area_id: undefined as number | undefined
})

// Dropdowns
const {
  areas,
  fetchAreas
} = useDockDropdowns()

// Modal state
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
function createEmptyDock(): Partial<Dock> {
  return {
    id: undefined,
    dock_code: '',
    name: '',
    area: undefined
  }
}

const currentDock = reactive<Partial<Dock>>(createEmptyDock())

// Confirm dialog
const confirmDialog = reactive({
  open: false,
  title: '',
  description: '',
  action: null as (() => Promise<void>) | null
})

// Table state
const rowSelection = ref({})
const expanded = ref({})

// Columns
const { columns } = useDockColumns({
  onEdit: openEditModal,
  onDelete: handleDelete
}, uiComponents, pagination)

// Computed
const selectedCount = computed(() => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

// Fetch data
async function fetchData() {
  const params: Record<string, any> = {
    page: meta.value.page,
    limit: meta.value.limit,
    search: search.value
  }
  if (filters.area_id) params.area_id = filters.area_id
  await dockStore.fetchDocks(params)
}

// Modal handlers
function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentDock, createEmptyDock())
  isModalOpen.value = true
}

function openEditModal(dock: Dock) {
  modalMode.value = 'edit'
  Object.assign(currentDock, {
    id: dock.id,
    dock_code: dock.dock_code,
    name: dock.name,
    area: dock.area
  })
  isModalOpen.value = true
}

async function handleSave(data: Partial<Dock>) {
  try {
    let message = ''

    if (modalMode.value === 'add') {
      const res = await dockStore.createDock(data)
      message = res.message || 'Dock created successfully'
    } else {
      const res = await dockStore.updateDock(currentDock.id!, data)
      message = res.message || 'Dock updated successfully'
    }
    toastSuccess(message)
    isModalOpen.value = false
    fetchData()
  } catch (err: any) {
    toastError(err)
  }
}

async function handleDelete(dock: Dock) {
  confirmDialog.title = 'Delete Dock'
  confirmDialog.description = `Are you sure you want to delete dock "${dock.dock_code}"?`
  confirmDialog.action = async () => {
    try {
      const res = await dockStore.deleteDock(dock.id)
      toastSuccess(res.message || 'Dock deleted successfully')
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

  confirmDialog.title = 'Delete Multiple Docks'
  confirmDialog.description = `Are you sure you want to delete ${selectedRows.length} dock(s)?`

  confirmDialog.action = async () => {
    try {
      await Promise.all(
        selectedRows.map((row: Row<Dock>) =>
          dockStore.deleteDock(row.original.id)
        )
      )
      rowSelection.value = {}
      toastSuccess(`${selectedRows.length} docks deleted successfully`)
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
  fetchAreas()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">
        Dock Management
      </h1>
    </div>

    <DockFilters
      :search="search"
      :filters="filters"
      :areas="areas"
      @update:search="onUpdateSearch"
      @update:filters="onUpdateFilters"
    />

    <div class="flex gap-2">
      <UButton
        icon="i-lucide-plus"
        color="primary"
        variant="solid"
        label="Add Dock"
        @click="openAddModal"
      />
    </div>

    <DockBulkActions
      :count="selectedCount"
      @delete="handleBulkDelete"
    />

    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      v-model:expanded="expanded"
      :data="loading ? [] : docks"
      :columns="columns"
      :loading="loading"
      class="w-full"
    >
      <template #expanded="{ row }">
        <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-elevated/50 border-b border-default">
          <div class="space-y-1">
            <h4 class="font-semibold text-sm text-highlighted">
              Dock Details
            </h4>
            <p class="text-sm wrap-break-word whitespace-normal">
              <span class="text-muted">Dock Code:</span> {{ row.original.dock_code || '-' }}
            </p>
            <p class="text-sm wrap-break-word whitespace-normal">
              <span class="text-muted">Dock Name:</span> {{ row.original.name || '-' }}
            </p>
            <p class="text-sm wrap-break-word whitespace-normal">
              <span class="text-muted">Warehouse Area:</span> {{ row.original.area?.name || '-' }}
            </p>
          </div>
          <div class="space-y-1">
            <h4 class="font-semibold text-sm text-highlighted">
              System Info
            </h4>
            <p class="text-sm wrap-break-word whitespace-normal">
              <span class="text-muted">Created:</span> {{ row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : '-' }}
            </p>
            <p class="text-sm wrap-break-word whitespace-normal">
              <span class="text-muted">Updated:</span> {{ row.original.updatedAt ? new Date(row.original.updatedAt).toLocaleString() : '-' }}
            </p>
          </div>
        </div>
      </template>
    </UTable>

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

    <DockFormModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :dock="currentDock"
      :areas="areas"
      :loading="loading"
      @save="handleSave"
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