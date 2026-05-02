<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, resolveComponent } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

import { useWorkOrderStoringStore } from '../../../stores/warehouse/work-order-storing.store'
import { useWorkOrderStoringColumns } from './composables/useWorkOrderStoringColumns'
import { useAppToast } from '../../../composables/useAppToast'

import type { WorkOrderStoring, WorkOrderStoringCategory } from '../../../types/warehouse/work-order-storing'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import WorkOrderStoringFilters from './components/WorkOrderStoringFilters.vue'

// Store
const workOrderStoringStore = useWorkOrderStoringStore()
const { workOrders, workOrderStatuses, meta, loading } = storeToRefs(workOrderStoringStore)

const { toastSuccess, toastError } = useAppToast()

const router = useRouter()

const uiComponents = {
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
  { label: 'Warehouse' },
  { label: 'Work Order Storing' }
]

// State
const search = ref('')
const filters = reactive({
  wo_category: undefined as WorkOrderStoringCategory | undefined,
  wo_status_id: undefined as number | undefined
})

const categories: WorkOrderStoringCategory[] = ['Placement', 'Take Out']

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
const { columns } = useWorkOrderStoringColumns({
  onEdit: handleEdit,
  onDelete: handleDelete
}, uiComponents, pagination)

// Fetch data
async function fetchData() {
  const params: Record<string, any> = {
    page: meta.value.page,
    limit: meta.value.limit,
    search: search.value
  }
  if (filters.wo_category) params.wo_category = filters.wo_category
  if (filters.wo_status_id) params.wo_status_id = filters.wo_status_id

  await workOrderStoringStore.fetchWorkOrders(params)
}

// Modal handlers
function handleEdit(row: WorkOrderStoring) {
  router.push(`/warehouse/work-order-storing/edit/${row.id}`)
}

async function handleDelete(row: WorkOrderStoring) {
  confirmDialog.title = 'Delete Work Order Storing'
  confirmDialog.description = `Are you sure you want to delete work order "${row.wo_number}"?`
  confirmDialog.action = async () => {
    try {
      const res = await workOrderStoringStore.deleteWorkOrder(row.id)
      toastSuccess(res.message || 'Work order deleted successfully')
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

function goToCreate() {
  router.push('/warehouse/work-order-storing/create')
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
  workOrderStoringStore.fetchWorkOrderTypesDropdown()
  workOrderStoringStore.fetchWorkOrderStatusesDropdown()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">
        Work Order Management
      </h1>
    </div>

    <WorkOrderStoringFilters
      :search="search"
      :filters="filters"
      :statuses="workOrderStatuses"
      :categories="categories"
      @update:filters="onUpdateFilters"
      @update:search="onUpdateSearch"
    />

    <div class="flex gap-2">
      <UButton
        icon="i-lucide:clipboard-list"
        color="primary"
        variant="solid"
        label="Create Work Order"
        @click="goToCreate"
      />
    </div>

    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      :data="loading ? [] : workOrders"
      :columns="columns"
      :loading="loading"
      class="w-full"
    />

    <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
      <div class="text-sm text-muted">
        {{ meta.total }} total data.
      </div>
      <UPagination
        v-model:page="meta.page"
        :total="meta.total"
        :items-per-page="meta.limit"
        @update:page="fetchData"
      />
    </div>

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