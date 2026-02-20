<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useWarehouseStore } from '../../../stores/master-data/warehouse.store'
import { useWarehouseDropdowns } from './composables/useWarehouseDropdowns'
import { useWarehouseColumns } from './composables/useWarehouseColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { Warehouse, WarehousePayload } from '../../../types'
import type { Row } from '@tanstack/table-core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import WarehouseFilters from './components/WarehouseFilters.vue'
import WarehouseBulkActions from './components/WarehouseBulkActions.vue'
import WarehouseFormModal from './components/WarehouseFormModal.vue'

// Store
const warehouseStore = useWarehouseStore()
const { warehouses, meta, loading } = storeToRefs(warehouseStore)
const { toastSuccess, toastError } = useAppToast()
const table = useTemplateRef<any>('table')

const uiComponents = {
  UCheckbox: resolveComponent('UCheckbox'),
  UBadge: resolveComponent('UBadge'),
  UButton: resolveComponent('UButton'),
  UDropdownMenu: resolveComponent('UDropdownMenu')
}

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Master Data' },
  { label: 'Warehouses' }
]

// State
const search = ref('')
const filters = reactive({
  category_id: undefined as number | undefined,
  line_id: undefined as number | undefined
})

// Dropdowns
const { 
  warehouseCategories, 
  lines, 
  fetchWarehouseCategories, 
  fetchLines 
} = useWarehouseDropdowns()

// Modal state
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
function createEmptyWarehouse(): Partial<Warehouse> {
  return {
    id: undefined,
    warehouse_code: '',
    name: '',
    category: undefined,
    line: undefined,
    notes: ''
  }
}

const currentWarehouse = reactive<Partial<Warehouse>>(createEmptyWarehouse())

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
const { columns } = useWarehouseColumns({
  onEdit: openEditModal,
  onDelete: handleDelete
}, uiComponents)

// Computed
const selectedCount = computed(() => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

// Fetch Data
async function fetchData() {
  const params: Record<string, any> = {
    page: meta.value.page,
    limit: meta.value.limit,
    search: search.value
  }
  if (filters.category_id) params.category_id = filters.category_id
  if (filters.line_id) params.line_id = filters.line_id

  await warehouseStore.fetchWarehouses(params)
}

// Modal Handlers
function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentWarehouse, createEmptyWarehouse())
  isModalOpen.value = true
}

function openEditModal(warehouse: Warehouse) {
  modalMode.value = 'edit'
  Object.assign(currentWarehouse, {
    id: warehouse.id,
    warehouse_code: warehouse.warehouse_code,
    name: warehouse.name,
    category: warehouse.category,
    line: warehouse.line,
    notes: warehouse.notes
  })
  isModalOpen.value = true
}

async function handleSave(data: WarehousePayload) {
  try {
    let message = ''

    if (modalMode.value === 'add') {
      const res = await warehouseStore.createWarehouse(data)
      message = res.message || 'Warehouse created'
    } else {
      const res = await warehouseStore.updateWarehouse(currentWarehouse.id!, data)
      message = res.message || 'Warehouse updated'
    }
    toastSuccess(message)
    isModalOpen.value = false
    fetchData()
  } catch (err: any) {
    toastError(err)
  }
}

async function handleDelete(row: Warehouse) {
  confirmDialog.title = 'Delete Warehouse'
  confirmDialog.description = `Are you sure you want to delete warehouse "${row.warehouse_code}"?`
  confirmDialog.action = async () => {
    try {
      const res = await warehouseStore.deleteWarehouse(row.id)
      toastSuccess(res.message || 'Warehouse deleted')
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

  confirmDialog.title = 'Delete Multiple Warehouses'
  confirmDialog.description = `Are you sure you want to delete ${selectedRows.length} warehouse(s)?`

  confirmDialog.action = async () => {
    try {
      await Promise.all(
        selectedRows.map((row: Row<Warehouse>) =>
          warehouseStore.deleteWarehouse(row.original.id)
        )
      )
      rowSelection.value = {}
      toastSuccess(`${selectedRows.length} warehouses deleted`)
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
  fetchWarehouseCategories()
  fetchLines()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Warehouse Management</h1>
    </div>

    <WarehouseFilters
      :search="search"
      :filters="filters"
      :warehouse-categories="warehouseCategories"
      :lines="lines"
      @update:search="onUpdateSearch"
      @update:filters="onUpdateFilters"
    />

    <div class="flex gap-2">
      <UButton
        icon="i-lucide-plus"
        color="primary"
        variant="solid"
        label="Add Warehouse"
        @click="openAddModal"
      />
    </div>

    <WarehouseBulkActions
      :count="selectedCount"
      @delete="handleBulkDelete"
    />

    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      v-model:expanded="expanded"
      :data="warehouses"
      :columns="columns"
      :loading="loading"
      class="w-full"
    >
      <template #expanded="{ row }">
        <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-elevated/50 border-b border-default">
          <div class="space-y-1">
            <h4 class="font-semibold text-sm text-highlighted">Warehouse Details</h4>
            <p class="text-sm break-words whitespace-normal"><span class="text-muted">Warehouse Code:</span> {{ row.original.warehouse_code || '-' }}</p>
            <p class="text-sm break-words whitespace-normal"><span class="text-muted">Warehouse Name:</span> {{ row.original.name || '-' }}</p>
            <p class="text-sm break-words whitespace-normal"><span class="text-muted">Notes:</span> {{ row.original.notes || '-' }}</p>
          </div>
          <div class="space-y-1">
            <h4 class="font-semibold text-sm text-highlighted">Classification</h4>
            <p class="text-sm break-words whitespace-normal"><span class="text-muted">Category:</span> {{ row.original.category?.name || '-' }}</p>
            <p class="text-sm break-words whitespace-normal"><span class="text-muted">Line:</span> {{ row.original.line?.name || '-' }}</p>
          </div>
          <div class="space-y-1">
            <h4 class="font-semibold text-sm text-highlighted">System Info</h4>
            <p class="text-sm break-words whitespace-normal"><span class="text-muted">Created:</span> {{ row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : '-' }}</p>
            <p class="text-sm break-words whitespace-normal"><span class="text-muted">Updated:</span> {{ row.original.updatedAt ? new Date(row.original.updatedAt).toLocaleString() : '-' }}</p>
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

    <WarehouseFormModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :warehouse="currentWarehouse"
      :categories="warehouseCategories"
      :lines="lines"
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