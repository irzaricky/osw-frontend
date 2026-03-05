<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useSupplierStore } from '../../../stores/master-data/supplier.store'
import { useSupplierColumns } from './composables/useSupplierColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { Suppliers } from '../../../types/master-data/suppliers'
import type { Row } from '@tanstack/table-core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import SupplierFilters from './components/SupplierFilters.vue'
import SupplierBulkActions from './components/SupplierBulkActions.vue'
import SupplierFormModal from './components/SupplierFormModal.vue'

// Store
const supplierStore = useSupplierStore()
const { suppliers, meta, loading } = storeToRefs(supplierStore)
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
  { label: 'Suppliers' }
]

// State
const search = ref('')

// Modal state — Form
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')

function createEmptySupplier(): Partial<Suppliers> {
  return {
    id: undefined,
    supplier_code: '',
    name: '',
    email: '',
    notes: ''
  }
}

const currentSupplier = reactive<Partial<Suppliers>>(createEmptySupplier())

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
const { columns } = useSupplierColumns({
  onEdit: openEditModal,
  onDelete: handleDelete
}, uiComponents)

// Computed
const selectedCount = computed((): number => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

// Data fetching
async function fetchData() {
  await supplierStore.fetchSuppliers({
    page: meta.value.page,
    limit: meta.value.limit,
    search: search.value
  })
}

// Modal handlers
function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentSupplier, createEmptySupplier())
  isModalOpen.value = true
}

function openEditModal(supplier: Suppliers) {
  modalMode.value = 'edit'
  Object.assign(currentSupplier, {
    id: supplier.id,
    supplier_code: supplier.supplier_code,
    name: supplier.name,
    email: supplier.email,
    notes: supplier.notes
  })
  isModalOpen.value = true
}

async function handleSave(data: Partial<Suppliers>) {
  try {
    let message = ''
    if (modalMode.value === 'add') {
      const res = await supplierStore.createSupplier(data)
      message = res.message || 'Supplier created'
    } else {
      const res = await supplierStore.updateSupplier(currentSupplier.id!, data)
      message = res.message || 'Supplier updated'
    }
    toastSuccess(message)
    isModalOpen.value = false
    fetchData()
  } catch (err: any) {
    toastError(err)
  }
}

// Row actions
async function handleDelete(row: Suppliers) {
  confirmDialog.title = 'Delete Supplier'
  confirmDialog.description = `Are you sure you want to delete supplier "${row.name}"? This action cannot be undone.`
  confirmDialog.action = async () => {
    try {
      const res = await supplierStore.deleteSupplier(row.id)
      toastSuccess(res.message || 'Supplier deleted')
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

  confirmDialog.title = 'Delete Multiple Suppliers'
  confirmDialog.description = `Are you sure you want to delete ${selectedRows.length} supplier(s)? This action cannot be undone.`
  confirmDialog.action = async () => {
    try {
      await Promise.all(selectedRows.map((row: Row<Suppliers>) => supplierStore.deleteSupplier(row.original.id)))
      rowSelection.value = {}
      toastSuccess(`${selectedRows.length} suppliers deleted`)
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
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Supplier Management
      </h1>
    </div>

    <SupplierFilters
      :search="search"
      @update:search="onUpdateSearch"
    />

    <div class="flex gap-2">
      <UButton
        icon="i-lucide-plus"
        color="primary"
        variant="solid"
        label="Add Supplier"
        @click="openAddModal"
      />
    </div>

    <SupplierBulkActions
      :count="selectedCount"
      @delete="handleBulkDelete"
    />

    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      :data="suppliers"
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

    <SupplierFormModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :supplier="currentSupplier"
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