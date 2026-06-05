<script setup lang="ts">
import { onMounted, reactive, resolveComponent, watch, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ApproveGoodReceiptModal from './components/ApproveGoodReceiptModal.vue'
import GoodReceiptFilters from './components/GoodReceiptFilters.vue'

import { useGoodReceiptStore } from '../../../stores/warehouse/good-receipt.store'
import { useGoodReceiptColumns } from './composables/useGoodReceiptColumns'
import { useAppToast } from '../../../composables/useAppToast'

import type { GoodReceipt } from '../../../types/warehouse/good-receipt'

// Store
const goodReceiptStore = useGoodReceiptStore()
const { goodReceipts, meta, loading } = storeToRefs(goodReceiptStore)

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

// State
const search = ref('')
const filters = reactive({
  status: undefined as any
})

// Table state
const rowSelection = ref({})

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Warehouse' },
  { label: 'Good Receipt' }
]

// Modal
const approveModal = reactive({
  open: false,
  receipt: null as GoodReceipt | null
})

// Open Approve Modal
function handleOpenApprove(
  receipt: GoodReceipt
) {
  approveModal.receipt = receipt
  approveModal.open = true
}

// Filter handlers
function onUpdateSearch(value: string) {
  search.value = value
}

function onUpdateFilters(partial: Record<string, any>) {
  Object.assign(filters, partial)
}

// Submit Approve
async function handleApprove(
  data: { remarks?: string }
) {
  if (!approveModal.receipt) {
    return
  }

  try {
    const res = await goodReceiptStore.approveGoodReceipt(approveModal.receipt.id, data)
    toastSuccess(res.message || 'Good receipt approved successfully.')
    approveModal.open = false
    await fetchData()
  } catch (err) {
    toastError(err)
  }
}

// Download Report
async function handleDownloadReport(receipt: GoodReceipt) {
  try {
    await goodReceiptStore.reportGoodReceipt(receipt.id)
  } catch (err) {
    toastError(err)
  }
}

// Fetch Data
async function fetchData() {
  const params: Record<string, any> = {
    page: meta.value.page,
    limit: meta.value.limit,
    search: search.value
  }
  if (filters.status?.id) params.status_id = filters.status.id

  await goodReceiptStore.fetchGoodReceipts(params)
}

// Columns
const { columns } = useGoodReceiptColumns({
  onViewDetail: handleDetail,
  onApprove: handleOpenApprove,
  onDownloadReport: handleDownloadReport
}, uiComponents, pagination)

function handleDetail(row: GoodReceipt) {
  router.push(`/warehouse/good-receipt/${row.id}`)
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
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">
        Good Receipt
      </h1>
    </div>

    <GoodReceiptFilters
      :search="search"
      :filters="filters"
      @update:filters="onUpdateFilters"
      @update:search="onUpdateSearch"
    />

    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      :data="loading ? [] : goodReceipts"
      :columns="columns"
      :loading="loading"
      class="w-full"
    />

    <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
      <div class="text-sm text-muted">
        Total {{ meta.total }} delivery order(s).
      </div>
      <UPagination
        v-model:page="meta.page"
        :total="meta.total"
        :items-per-page="meta.limit"
        @update:page="fetchData"
      />
    </div>

    <ApproveGoodReceiptModal
      v-model:open="approveModal.open"
      :receipt="approveModal.receipt"
      :loading="loading"
      @save="handleApprove"
    />
  </div>
</template>