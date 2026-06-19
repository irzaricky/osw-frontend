<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, resolveComponent } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

import { useOrderScheduleStore } from '../../../stores/production-plan/order-schedule.store'
import { useOrderScheduleColumns } from './composables/useOrderScheduleColumns'
import { useAppToast } from '../../../composables/useAppToast'
import { poStatusLabel, STATUS_OPTIONS } from './composables/usePOUtils'

import type { ProductionOrder, POStatus } from '../../../types/production-plan/order-schedule'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import OrderScheduleFilters from './components/PoFilters.vue'

// ── Store ──────────────────────────────────────────────────────────────────────
const store = useOrderScheduleStore()
const { orders, meta, loading, saving } = storeToRefs(store)
const { toastSuccess, toastError } = useAppToast()
const router = useRouter()

// ── Resolved UI components ─────────────────────────────────────────────────────
const uiComponents = {
  UCheckbox:     resolveComponent('UCheckbox'),
  UButton:       resolveComponent('UButton'),
  UDropdownMenu: resolveComponent('UDropdownMenu'),
  UBadge:        resolveComponent('UBadge'),
}

// ── Breadcrumbs ────────────────────────────────────────────────────────────────
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Production Plan' },
  { label: 'Production Order' },
]

// ── State ──────────────────────────────────────────────────────────────────────
const search = ref('')
const filters = reactive({
  status:  undefined as POStatus | undefined,
  plan_id: undefined as number | undefined,
})

const confirmDialog = reactive({
  open:        false,
  title:       '',
  description: '',
  action:      null as (() => Promise<void>) | null,
})

const rowSelection = ref({})

const pagination = computed(() => ({
  page:  meta.value.page,
  limit: meta.value.limit,
}))

// ── Columns ────────────────────────────────────────────────────────────────────
const { columns } = useOrderScheduleColumns(
  {
    onView:   handleView,
    onDelete: handleDelete,
  },
  uiComponents,
)

// ── Data fetching ──────────────────────────────────────────────────────────────
async function fetchData() {
  const params: Record<string, any> = {
    page:   meta.value.page,
    limit:  meta.value.limit,
    search: search.value || undefined,
  }
  if (filters.status)  params.status  = filters.status
  if (filters.plan_id) params.plan_id = filters.plan_id

  await store.fetchOrders(params)
}

// ── Handlers ───────────────────────────────────────────────────────────────────
function handleView(order: ProductionOrder) {
  router.push(`/production-plan/order-schedule/${order.id}`)
}

function handleDelete(order: ProductionOrder) {
  confirmDialog.title       = 'Delete Production Order'
  confirmDialog.description = `Are you sure you want to delete Production Order "${order.po_number}"? This action cannot be undone.`
  confirmDialog.action      = async () => {
    try {
      const res = await store.deleteOrder(order.id)
      toastSuccess(res.message || 'Production order deleted successfully.')
      confirmDialog.open = false
      fetchData()
    } catch (err) {
      toastError(err)
      confirmDialog.open = false
    }
  }
  confirmDialog.open = true
}

function onUpdateSearch(value: string) {
  search.value = value
}

function onUpdateFilters(partial: Record<string, any>) {
  Object.assign(filters, partial)
}

function goToCreate() {
  router.push('/production-plan/order-schedule/create')
}

// ── Watchers ───────────────────────────────────────────────────────────────────
const debouncedFetch = useDebounceFn(() => {
  meta.value.page = 1
  fetchData()
}, 300)

watch(search, () => debouncedFetch())
watch(filters, () => {
  meta.value.page = 1
  fetchData()
}, { deep: true })

// ── Lifecycle ──────────────────────────────────────────────────────────────────
onMounted(() => {
  fetchData()
})
</script>

<template>
  <UDashboardPanel id="order-schedule">
    <template #header>
      <UDashboardNavbar title="Order Scheduling">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="space-y-5">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold">
              Production Order
            </h1>
            <p class="text-sm text-muted mt-0.5">
              Manage and schedule production orders from approved production plans.
            </p>
          </div>
        </div>

        
        <div class="flex gap-2">
          <OrderScheduleFilters
            :search="search"
            :filters="filters"
            :status-options="STATUS_OPTIONS"
            @update:filters="onUpdateFilters"
            @update:search="onUpdateSearch"
          />
          <UButton
            icon="i-lucide-plus"
            class="ml-auto"
            color="primary"
            variant="solid"
            label="Create Production Order"
            @click="goToCreate"
          />
        </div>

        <UTable
          ref="table"
          v-model:row-selection="rowSelection"
          :data="loading ? [] : orders"
          :columns="columns"
          :loading="loading"
          class="w-full"
        />

        <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
          <div class="text-sm text-muted">
            {{ meta.total === 0 ? '0' : ((meta.page - 1) * meta.limit) + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }} of {{ meta.total }} production order(s)
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
          :loading="saving"
          @confirm="confirmDialog.action?.()"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>