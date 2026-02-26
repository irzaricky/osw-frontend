<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import type { Row } from '@tanstack/table-core'
import QRCode from 'qrcode'

import { useWarehouseAreaStore } from '../../../stores/master-data/warehouse-area.store'
import { useWarehouseStore } from '../../../stores/master-data/warehouse.store'
import { useWarehouseAreaColumns } from './composables/useWarehouseAreaColumns'
import { useAppToast } from '../../../composables/useAppToast'

import WarehouseAreaBulkAction from './components/WarehouseAreaBulkAction.vue'
import WarehouseAreaBinGridExpanded from './components/WarehouseAreaBinGridExpanded.vue'
import warehouseBinService from '../../../services/master-data/warehouse-bin.service'

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

// PRINT BIN LABELS
async function openPrintBinLabels(area: WarehouseArea) {
  try {
    const totalRows = Number(area.total_rows || 0)
    const totalCols = Number(area.total_cols || 0)
    const limit = totalRows * totalCols || 1000

    const res = await warehouseBinService.list({
      page: 1,
      limit,
      area_id: area.id
    })

    if (!res.data?.status) {
      toastError(res.data?.message || 'Failed to fetch bins')
      return
    }

    const bins = res.data.data?.rows || []
    if (!bins.length) {
      toastError('No bins found for this area')
      return
    }

    
    const qrList = await Promise.all(
      bins.map(async (bin: any) => {
        const payload = JSON.stringify({
          bin_code: bin.bin_code,
          area_code: area.area_code,
          row: bin.row_index,
          col: bin.col_index
        })
        const qr = await QRCode.toDataURL(payload, { margin: 1, width: 120 })
        return { bin, qr }
      })
    )

    const warehouseName = area.warehouse?.name || '-'
    const warehouseCode = area.warehouse?.warehouse_code || '-'
    const warehouseCategory = area.warehouse?.category?.name || '-'
    const areaCode = area.area_code || '-'
    const areaName = area.name || '-'
    const printedAt = new Date().toLocaleString()

    const labelsHtml = qrList
      .map(({ bin, qr }) => {
        return `
          <div class="paper">
            <div class="title">STORAGE BIN LABEL</div>
            <div class="qr-wrapper">
              <img class="qr" src="${qr}" alt="QR" />
              <div class="bin">${bin.bin_code || '-'}</div>
            </div>
            <table>
              <tbody>
                <tr><td class="label">Warehouse</td><td>${warehouseName}</td></tr>
                <tr><td class="label">Warehouse Number</td><td>${warehouseCode}</td></tr>
                <tr><td class="label">Warehouse Category</td><td>${warehouseCategory}</td></tr>
                <tr><td class="label">Area Number</td><td>${areaCode}</td></tr>
                <tr><td class="label">Area Name</td><td>${areaName}</td></tr>
                <tr><td class="label">Row</td><td>${bin.row_index ?? '-'}</td></tr>
                <tr><td class="label">Column</td><td>${bin.col_index ?? '-'}</td></tr>
                <tr><td class="label">Bin Number</td><td>${bin.bin_code || '-'}</td></tr>
                <tr><td class="label">Printed At</td><td>${printedAt}</td></tr>
              </tbody>
            </table>
          </div>
        `
      })
      .join('')

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Storage Bin Labels</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 18px; }
            .page { width: 900px; margin: 0 auto; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
            .paper { border: 2px solid #000; padding: 14px; background: #fff; color: #000; break-inside: avoid; }
            .title { font-size: 20px; font-weight: 800; text-align: center; margin-bottom: 6px; }
            .qr-wrapper {
              text-align: center;
              margin-bottom: 10px;
            }

            .qr {
              width: 120px;
              height: 120px;
              display: block;
              margin: 0 auto;
            }

            .bin {
              font-weight: 700;
              margin-top: 6px;
              text-align: center;
            }
            .qr { width: 120px; height: 120px; display: block; margin-left: auto; }
            .bin { font-weight: 700; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            td { border: 1px solid #000; padding: 8px; font-size: 12px; vertical-align: top; }
            td.label { background: #e5e5e5; width: 40%; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="grid">
              ${labelsHtml}
            </div>
          </div>
        </body>
      </html>
    `

    const win = window.open('', '_blank', 'width=1100,height=800')
    if (!win) {
      toastError('Popup blocked. Please allow popups to print.')
      return
    }

    win.document.open()
    win.document.write(html)
    win.document.close()
    win.onload = () => {
      win.focus()
      win.print()
      win.close()
    }
  } catch (err: any) {
    toastError(err?.response?.data?.message || err?.message || err)
  }
}


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
      toastError(err?.response?.data?.message || err?.message || err)
    } finally {
      confirmDialog.open = false
    }
  }

  confirmDialog.open = true
}

// COLUMNS
const { columns } = useWarehouseAreaColumns(
  {
    onEdit: openEditModal,
    onDelete: handleDelete,
    onPrint: openPrintModal,
    onPrintBinLabels: openPrintBinLabels
  },
  uiComponents
)

const selectedCount = computed(() => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

// WATCHERS
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

watch(
  () => meta.value.page,
  () => {
    fetchData()
  }
)

// LIFECYCLE
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
    <div class="flex flex-wrap items-center gap-3">
    <USelectMenu
      v-model="filters.warehouse"
      :items="warehouseItems"
      placeholder="Filter by Warehouse"
      class="w-full md:w-48"
      clear
    />
    
    <UInput 
      v-model="search" 
      icon="i-lucide-search"
      placeholder="Search area code or name..."
      class="w-full md:w-64 ml-auto"
    />
  </div>

    <!-- ACTION -->
    <div class="flex gap-2">
      <UButton icon="i-lucide-plus" color="primary" label="Add Area" @click="openAddModal" />
    </div>

    <WarehouseAreaBulkAction :count="selectedCount" @delete="handleBulkDelete" />

    <!-- TABLE -->
    <UTable ref="table" v-model:row-selection="rowSelection" v-model:expanded="expanded" :data="areas"
      :columns="columns" :loading="loading" class="w-full">
      <template #expanded="{ row }">
        <div class="p-4 bg-white dark:bg-slate-950 border-b border-default">
          <div class="mb-3 text-sm font-semibold">
            Area: {{ row.original.area_code }} — {{ row.original.name }}
          </div>

          <WarehouseAreaBinGridExpanded :area="row.original" />
        </div>
      </template>
    </UTable>

    <!-- PAGINATION -->
    <div class="flex justify-between items-center pt-4 border-t">
      <div class="text-sm text-muted">
        {{ selectedCount }} of {{ meta.total }} row(s) selected.
      </div>

      <UPagination v-model:page="meta.page" :total="meta.total" :items-per-page="meta.limit" @update:page="fetchData" />
    </div>

    <!-- MODALS -->
    <WarehouseAreaFormModal v-model:open="isModalOpen" :mode="modalMode" :area="currentArea" :warehouses="warehouses"
      :loading="loading" @save="handleSave" />

    <WarehouseAreaPrintModal v-model:open="isPrintOpen" :area="currentArea" />

    <ConfirmDialog v-model:open="confirmDialog.open" :title="confirmDialog.title"
      :description="confirmDialog.description" confirm-label="Delete" :loading="loading"
      @confirm="confirmDialog.action?.()" />
  </div>
</template>