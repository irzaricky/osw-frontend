<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import { useTransactionActivityStore } from '../../../stores/warehouse/transaction-activity.store'
import { useWarehouseAreaStore } from '../../../stores/master-data/warehouse-area.store'

import TransactionActivityFilters from './components/TransactionActivityFilters.vue'
import TransactionActivityTable from './components/TransactionActivityTable.vue'

const transactionActivityStore = useTransactionActivityStore()
const warehouseAreaStore = useWarehouseAreaStore()

const { transactionActivities, meta, loading } = storeToRefs(transactionActivityStore)
const { dropdown: warehouseAreas } = storeToRefs(warehouseAreaStore)

const search = ref('')

const filters = reactive({
    activity_type: undefined as 'IN' | 'OUT' | undefined,
    wo_category: undefined as string | undefined,
    warehouse_area_id: undefined as number | undefined,
    date_from: undefined as string | undefined,
    date_to: undefined as string | undefined
})

const breadcrumbItems = [
    { label: 'Home', to: '/' },
    { label: 'Warehouse' },
    { label: 'Transaction Activity' }
]

async function fetchData() {
    const params: Record<string, any> = {
        page: meta.value.page,
        limit: meta.value.limit,
        search: search.value
    }

    if (filters.activity_type) params.activity_type = filters.activity_type
    if (filters.wo_category) params.wo_category = filters.wo_category
    if (filters.warehouse_area_id) params.warehouse_area_id = filters.warehouse_area_id
    if (filters.date_from) params.date_from = filters.date_from
    if (filters.date_to) params.date_to = filters.date_to

    await transactionActivityStore.fetchTransactionActivities(params)
}

function onUpdateSearch(value: string) {
    search.value = value
}

function onUpdateFilters(partial: Record<string, any>) {
    Object.assign(filters, partial)
}

function resetFilters() {
    search.value = ''
    filters.activity_type = undefined
    filters.wo_category = undefined
    filters.warehouse_area_id = undefined
    filters.date_from = undefined
    filters.date_to = undefined
    meta.value.page = 1
    fetchData()
}

const debouncedFetch = useDebounceFn(() => {
    meta.value.page = 1
    fetchData()
}, 300)

watch(search, () => debouncedFetch())

watch(filters, () => {
    meta.value.page = 1
    fetchData()
}, { deep: true })

onMounted(() => {
    fetchData()
    warehouseAreaStore.fetchDropdown()
})
</script>

<template>
    <div class="p-6 space-y-6">
        <Breadcrumbs :items="breadcrumbItems" />

        <div>
            <h1 class="text-2xl font-bold">
                Transaction Activity
            </h1>
            <p class="text-sm text-muted">
                Track placement and take out stock movement activity.
            </p>
        </div>

        <TransactionActivityFilters :search="search" :filters="filters" :warehouse-areas="warehouseAreas"
            @update:search="onUpdateSearch" @update:filters="onUpdateFilters" @reset="resetFilters" />

        <TransactionActivityTable :data="transactionActivities" :loading="loading" :page="meta.page"
            :limit="meta.limit" />

        <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
            <div class="text-sm text-muted">
                Total {{ meta.total }} transaction(s)
            </div>

            <UPagination v-model:page="meta.page" :total="meta.total" :items-per-page="meta.limit"
                @update:page="fetchData" />
        </div>
    </div>
</template>