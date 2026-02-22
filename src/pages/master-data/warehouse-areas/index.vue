<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import type { Row } from '@tanstack/table-core'

import { useWarehouseAreaStore } from '../../../stores/master-data/warehouse-area.store'
import { useWarehouseStore } from '../../../stores/master-data/warehouse.store'
import { useWarehouseAreaColumns } from './composables/useWarehouseAreaColumns'
import { useAppToast } from '../../../composables/useAppToast'

import WarehouseAreaBulkAction from './components/WarehouseAreaBulkAction.vue'
import WarehouseAreaBinGrid from './components/WarehouseAreaBinGrid.vue'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import WarehouseAreaFormModal from './components/WarehouseAreaFormModal.vue'
import WarehouseAreaPrintModal from './components/WarehouseAreaPrintModal.vue'

import type { WarehouseArea, WarehouseAreaPayload } from '../../../types'

// STORE
const areaStore = useWarehouseAreaStore()
const warehouseStore = useWarehouseStore()
const { areas, meta, loading } = storeToRefs(areaStore)
const { warehouses } = storeToRefs(warehouseStore)

const { toastSuccess, toastError } = useAppToast()
const table = useTemplateRef<any>('table')

// UI Components
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
  { label: 'Warehouse Areas' }
]

// STATE
const search = ref('')
const filters = reactive({
  warehouse: undefined as { label: string; value: number | undefined } | undefined
})

const warehouseItems = computed(() => [
  { label: 'All Warehouse', value: undefined },
  ...(warehouses.value || []).map((w: any) => ({
    label: w.name,
    value: w.id
  }))
])

// MODAL
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const isPrintOpen = ref(false)

function createEmptyArea(): Partial<WarehouseArea> {
  return {
    id: undefined,
    warehouse: undefined,
    area_code: '',
    name: '',
    total_cols: 1,
    total_rows: 1
  }
}
const currentArea = reactive<Partial<WarehouseArea>>(createEmptyArea())

// CONFIRM
const confirmDialog = reactive({
  open: false,
  title: '',
  description: '',
  action: null as (() => Promise<void>) | null
})

// TABLE STATE
const rowSelection = ref({})
const expanded = ref({})

// COLUMNS
const { columns } = useWarehouseAreaColumns(
  {
    onEdit: openEditModal,
    onDelete: handleDelete,
    onPrint: openPrintModal
  },
  uiComponents
)

const selectedCount = computed(() => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

// FETCH
async function fetchData() {
  const params: Record<string, any> = {
    page: meta.value.page,
    limit: meta.value.limit
  }

  if (search.value?.trim()) params.search = search.value.trim()
  if (filters.warehouse?.value) params.warehouse_id = filters.warehouse.value

  await areaStore.fetchAreas(params)
}

// MODAL HANDLERS
function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentArea, createEmptyArea())
  isModalOpen.value = true
}

function openEditModal(area: WarehouseArea) {
  modalMode.value = 'edit'
  Object.assign(currentArea, area)
  isModalOpen.value = true
}

function openPrintModal(area: WarehouseArea) {
  Object.assign(currentArea, area)
  isPrintOpen.value = true
}

async function handleSave(data: WarehouseAreaPayload) {
  try {
    let message = ''

    if (modalMode.value === 'add') {
      const res = await areaStore.createArea(data)
      message = res?.message || 'Warehouse Area created'
    } else {
      const res = await areaStore.updateArea(currentArea.id!, data)
      message = res?.message || 'Warehouse Area updated'
    }

    toastSuccess(message)
    isModalOpen.value = false
    await fetchData()
  } catch (err: any) {
    
    console.log('SAVE ERROR:', err)
    console.log('STATUS:', err?.response?.status)
    console.log('DATA:', err?.response?.data)

    toastError(err?.response?.data?.message || err?.message || err)
  }
}

async function handleDelete(area: WarehouseArea) {
  confirmDialog.title = 'Delete Warehouse Area'
  confirmDialog.description = `Are you sure you want to delete area "${area.area_code}"?`

  confirmDialog.action = async () => {
    try {
      const res = await areaStore.deleteArea(area.id)
      toastSuccess(res?.message || 'Deleted')
      await fetchData()
    } catch (err: any) {
      console.log('DELETE ERROR:', err?.response?.status, err?.response?.data)
      toastError(err?.response?.data?.message || err?.message || err)
    } finally {
      confirmDialog.open = false
    }
  }

  confirmDialog.open = true
}

async function handleBulkDelete() {
  const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().rows || []
  if (!selectedRows.length) return

  confirmDialog.title = 'Delete Multiple Areas'
  confirmDialog.description = `Are you sure you want to delete ${selectedRows.length} area(s)?`

  confirmDialog.action = async () => {
    try {
      await Promise.all(
        selectedRows.map((row: Row<WarehouseArea>) => areaStore.deleteArea(row.original.id))
      )

      rowSelection.value = {}
      toastSuccess(`${selectedRows.length} area(s) deleted`)
      await fetchData()
    } catch (err: any) {
      console.log('BULK DELETE ERROR:', err?.response?.status, err?.response?.data)
      toastError(err?.response?.data?.message || err?.message || err)
    } finally {
      confirmDialog.open = false
    }
  }

  confirmDialog.open = true
}


const debouncedFetch = useDebounceFn(() => {
  meta.value.page = 1
  fetchData()
}, 300)

watch(search, () => debouncedFetch())

watch(
  () => filters.warehouse?.value,
  () => {
    meta.value.page = 1
    fetchData()
  }
)


onMounted(async () => {
  await warehouseStore.fetchWarehouses({ page: 1, limit: 100 })
  await fetchData()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Warehouse Area Management</h1>
    </div>

    <!-- FILTER -->
    <div class="flex gap-3">
      <UInput
        v-model="search"
        placeholder="Search area code or name..."
        icon="i-lucide-search"
      />

      <USelectMenu
        v-model="filters.warehouse"
        :items="warehouseItems"
        searchable
        placeholder="Filter by Warehouse"
        class="w-full md:w-44"
        clear
      />
    </div>

    <!-- ACTION -->
    <div class="flex gap-2">
      <UButton
        icon="i-lucide-plus"
        color="primary"
        label="Add Area"
        @click="openAddModal"
      />
    </div>

    <WarehouseAreaBulkAction :count="selectedCount" @delete="handleBulkDelete" />

    <!-- TABLE -->
    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      v-model:expanded="expanded"
      :data="areas"
      :columns="columns"
      :loading="loading"
      class="w-full"
    >
      <template #expanded="{ row }">
        <div class="p-4 bg-white dark:bg-slate-950 border-b border-default">
          <div class="mb-3 text-sm font-semibold">
            Area: {{ row.original.area_code }} — {{ row.original.name }}
          </div>
          <WarehouseAreaBinGrid :area="row.original" />
        </div>
      </template>
    </UTable>

    <!-- PAGINATION -->
    <div class="flex justify-between items-center pt-4 border-t">
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

    <!-- MODALS -->
    <WarehouseAreaFormModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :area="currentArea"
      :warehouses="warehouses"
      :loading="loading"
      @save="handleSave"
    />

    <WarehouseAreaPrintModal v-model:open="isPrintOpen" :area="currentArea" />

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