<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useCustomerStore } from '../../../stores/master-data/customer.store'
import { useCustomerColumns } from './composables/useCustomerColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { Customer } from '../../../types/master-data/customer'
import type { Row } from '@tanstack/table-core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import CustomerFilters from './components/CustomerFilters.vue'
import CustomerBulkActions from './components/CustomerBulkActions.vue'
import CustomerFormModal from './components/CustomerFormModal.vue'

// Store
const customerStore = useCustomerStore()
const { customers, meta, loading } = storeToRefs(customerStore)
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
  { label: 'Customers' }
]

// State - Customers
const search = ref('')

// Modal state
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')

function createEmptyCustomer(): Partial<Customer> {
  return {
    id: undefined,
    customer_code: '',
    name: '',
    email: '',
    address: ''
  }
}

const currentCustomer = reactive<Partial<Customer>>(createEmptyCustomer())

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
const { columns } = useCustomerColumns({
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

  await customerStore.fetchCustomers(params)
}

async function handleDownload() {
  try {
    const params: Record<string, any> = {
      search: search.value
    }
    const blob = await customerStore.downloadCustomers(params)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Customers_${new Date().getTime()}.xlsx`) 
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    toastError(err)
  }
}

// Modal Handlers
function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentCustomer, createEmptyCustomer())
  isModalOpen.value = true
}

function openEditModal(customer: Customer) {
  modalMode.value = 'edit'
  Object.assign(currentCustomer, {
    id: customer.id,
    customer_code: customer.customer_code,
    name: customer.name,
    email: customer.email,
    address: customer.address
  })
  isModalOpen.value = true
}

async function handleSave(data: Partial<Customer>) {
  try {
    let message = ''
    
    if (modalMode.value === 'add') {
      const res = await customerStore.createCustomer(data)
      message = res.message || 'Customer created'
    } else {
      const res = await customerStore.updateCustomer(currentCustomer.id!, data)
      message = res.message || 'Customer updated'
    }
    toastSuccess(message)
    isModalOpen.value = false
    fetchData()
  } catch (err: any) {
    toastError(err)
  }
}

// Row Actions
async function handleDelete(row: Customer) {
  confirmDialog.title = 'Delete Customer'
  confirmDialog.description = `Are you sure you want to delete customer "${row.name}"? This action cannot be undone.`
  confirmDialog.action = async () => {
    try {
      const res = await customerStore.deleteCustomer(row.id)
      toastSuccess(res.message || 'Customer deleted')
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
  
  confirmDialog.title = 'Delete Multiple Customers'
  confirmDialog.description = `Are you sure you want to delete ${selectedRows.length} customer(s)? This action cannot be undone.`
  confirmDialog.action = async () => {
    try {
      await Promise.all(selectedRows.map((row: Row<Customer>) => customerStore.deleteCustomer(row.original.id)))
      rowSelection.value = {}
      toastSuccess(`${selectedRows.length} customers deleted`)
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
        Customer Management
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
          icon="i-lucide-plus" 
          color="primary" 
          variant="solid" 
          label="Add Customer" 
          @click="openAddModal" 
        />
      </div>

      <CustomerFilters 
        :search="search"
        @update:search="onUpdateSearch"
      />
    </div>

    <!-- Bulk Actions -->
    <CustomerBulkActions 
      :count="selectedCount"
      @delete="handleBulkDelete"
    />

    <!-- Table -->
    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      :data="customers" 
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
    
    <!-- Modal -->
    <CustomerFormModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :customer="currentCustomer"
      :loading="loading"
      @save="handleSave"
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
