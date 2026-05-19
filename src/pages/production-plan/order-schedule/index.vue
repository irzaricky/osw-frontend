<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { useOrderScheduleStore } from '../../../stores/production-plan/order-schedule.store'
import { useOrderScheduleColumns } from './composables/useOrderScheduleColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { ProductionOrder } from '../../../types/production-plan/order-schedule'
import type { Row } from '@tanstack/table-core'

import Breadcrumbs   from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import OrderFilters    from './components/OrderFilters.vue'
import OrderBulkActions from './components/OrderBulkActions.vue'

const router     = useRouter()
const orderStore = useOrderScheduleStore()
const { orders, meta, loading } = storeToRefs(orderStore)
const { toastSuccess, toastError } = useAppToast()

const table = useTemplateRef('table')

const ui = {
  UCheckbox:     resolveComponent('UCheckbox') as any,
  UButton:       resolveComponent('UButton') as any,
  UDropdownMenu: resolveComponent('UDropdownMenu') as any,
  UBadge:        resolveComponent('UBadge') as any,
}

const { columns } = useOrderScheduleColumns(
  {
    onView:   (order) => router.push(`/production-plan/order-schedule/${order.id}`),
    onDelete: confirmDelete,
  },
  ui,
)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Production Plan' },
  { label: 'Production Order' },
]

const search  = ref('')
const filters = reactive({
  status:    undefined as string | undefined,
  priority:  undefined as string | undefined,
  date_from: undefined as string | undefined,
  date_to:   undefined as string | undefined,
})

const rowSelection = ref({})

const selectedCount = computed((): number =>
  table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0,
)

const confirm = reactive({
  open:        false,
  title:       '',
  description: '',
  action:      null as (() => Promise<void>) | null,
})

async function fetchData() {
  await orderStore.fetchOrders({
    page:      meta.value.page,
    limit:     meta.value.limit,
    search:    search.value || undefined,
    status:    filters.status as any,
    priority:  filters.priority as any,
    date_from: filters.date_from,
    date_to:   filters.date_to,
  })
}

const debouncedSearch = useDebounceFn(() => { meta.value.page = 1; fetchData() }, 300)

watch(search, debouncedSearch)
watch(filters, () => { meta.value.page = 1; fetchData() }, { deep: true })

function confirmDelete(order: ProductionOrder) {
  confirm.title       = 'Delete Production Order'
  confirm.description = `Are you sure you want to delete "${order.po_number}"? This action cannot be undone.`
  confirm.action      = async () => {
    try {
      const res = await orderStore.deleteOrder(order.id)
      toastSuccess(res.message || 'Production Order deleted')
      fetchData()
      confirm.open = false
    } catch (e) {
      toastError(e)
      confirm.open = false
    }
  }
  confirm.open = true
}

function confirmBulkDelete() {
  const rows = table.value?.tableApi?.getFilteredSelectedRowModel().rows || []
  if (!rows.length) return
  confirm.title       = 'Delete Selected Orders'
  confirm.description = `Are you sure you want to delete ${rows.length} order(s)? This action cannot be undone.`
  confirm.action      = async () => {
    try {
      await Promise.all(rows.map((r: Row<ProductionOrder>) => orderStore.deleteOrder(r.original.id)))
      toastSuccess(`${rows.length} orders deleted`)
      rowSelection.value = {}
      fetchData()
      confirm.open = false
    } catch (e) {
      toastError(e)
      confirm.open = false
    }
  }
  confirm.open = true
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <UDashboardPanel id="order-schedule">
    <template #header>
      <UDashboardNavbar title="Production Order">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-5">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold">Production Orders</h1>
            <p class="text-sm text-muted mt-0.5">
              Manage production orders and daily scheduling
            </p>
          </div>
          <UButton
            icon="i-lucide-plus"
            color="primary"
            label="New Production Order"
            @click="router.push('/production-plan/order-schedule/create')"
          />
        </div>

        <OrderFilters
          :search="search"
          :filters="filters"
          @update:search="search = $event"
          @update:filters="Object.assign(filters, $event)"
        />

        <OrderBulkActions :count="selectedCount" @delete="confirmBulkDelete" />

        <UTable
          ref="table"
          v-model:row-selection="rowSelection"
          :data="orders"
          :columns="columns"
          :loading="loading"
          class="w-full"
        />

        <!-- Pagination -->
        <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
          <div class="text-sm text-muted">
            {{ meta.total === 0 ? '0' : ((meta.page - 1) * meta.limit) + 1 }}–{{
              Math.min(meta.page * meta.limit, meta.total)
            }} of {{ meta.total }} row(s)
          </div>
          <UPagination
            v-model:page="meta.page"
            :total="meta.total"
            :items-per-page="meta.limit"
            @update:page="fetchData"
          />
        </div>

        <ConfirmDialog
          v-model:open="confirm.open"
          :title="confirm.title"
          :description="confirm.description"
          confirm-label="Delete"
          :loading="loading"
          @confirm="confirm.action?.()"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>