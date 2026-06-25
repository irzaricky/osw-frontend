<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

import Breadcrumbs from '../../../../components/Breadcrumbs.vue'
import { useProductionMaterialResultStore } from '../../../../stores/production/production-material-result.store'

import ProductionResultFilters from './components/ProductionResultFilters.vue'
import ProductionResultTable from './components/ProductionResultTable.vue'
import ProductionResultFormModal from './components/ProductionResultFormModal.vue'
import productionMaterialControlService from '../../../../services/production/production-material-control.service'

const store = useProductionMaterialResultStore()
const { productionResults, meta, loading } = storeToRefs(store)

const search = ref('')

const filters = reactive({
    date_from: undefined as string | undefined,
    date_to: undefined as string | undefined,
    station_id: undefined as number | undefined
})

const breadcrumbItems = [
    { label: 'Home', to: '/' },
    { label: 'Production' },
    { label: 'Production Material Control' },
    { label: 'Production Result' }
]

const shifts = ref<any[]>([])
const stations = ref<any[]>([])
const products = ref<any[]>([])
const showFormModal = ref(false)
const submitLoading = ref(false)
const bomMaterials = ref<any[]>([])
const bomLoading = ref(false)
const productionWos = ref<any[]>([])
const materialLabels = ref<any[]>([])
const materialLabelLoading = ref(false)

async function fetchProductionWos() {
    const res = await productionMaterialControlService.getProductionWos()
    productionWos.value = res.data.data || []
}

async function handleSelectProductionWo(productionWoId: number, stationId: number) {
    if (!productionWoId || !stationId) return

    materialLabelLoading.value = true

    try {
        const res = await productionMaterialControlService.getProductionWoMaterialLabels(
            productionWoId,
            stationId
        )

        const materials = res.data.data || []

        materialLabels.value = materials.flatMap((material: any) =>
            (material.labels || []).map((label: any) => ({
                wo_item_label_id: label.wo_item_label_id,
                label_id: label.label_id,
                label_number: label.label_number,
                material_part_id: material.material_part_id,
                part_number: material.part_number,
                part_name: material.part_name
            }))
        )
    } finally {
        materialLabelLoading.value = false
    }
}


async function fetchData() {
    const params: Record<string, any> = {
        page: meta.value.page,
        limit: meta.value.limit,
        search: search.value
    }

    if (filters.date_from) params.date_from = filters.date_from
    if (filters.date_to) params.date_to = filters.date_to
    if (filters.station_id) params.station_id = filters.station_id

    await store.fetchProductionResults(params)
}

async function fetchDropdowns() {
    const res = await productionMaterialControlService.getDropdowns()

    shifts.value = res.data.data?.shifts || []
    stations.value = res.data.data?.stations || []
    products.value = res.data.data?.products || []
}

function onUpdateSearch(value: string) {
    search.value = value
}

function onUpdateFilters(partial: Record<string, any>) {
    Object.assign(filters, partial)
}

function resetFilters() {
    search.value = ''
    filters.date_from = undefined
    filters.date_to = undefined
    filters.station_id = undefined
    meta.value.page = 1
    fetchData()
}

async function handleCreate(data: any) {
    submitLoading.value = true

    try {
        await store.createProductionResult(data)
        showFormModal.value = false
        await fetchData()
    } finally {
        submitLoading.value = false
    }
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
    fetchDropdowns()
    fetchProductionWos()
})
</script>

<template>
    <div class="p-6 space-y-6">
        <Breadcrumbs :items="breadcrumbItems" />

        <div>
            <h1 class="text-2xl font-bold">
                Production Result
            </h1>
            <p class="text-sm text-muted">
                Record and monitor production planning, actual output, OK, and NG material.
            </p>
        </div>

        <UButton icon="i-lucide-plus" label="Add Production Result" color="primary" @click="showFormModal = true" />

        <ProductionResultFilters :search="search" :filters="filters" @update:search="onUpdateSearch"
            @update:filters="onUpdateFilters" @reset="resetFilters" />

        <ProductionResultTable :data="productionResults" :loading="loading" :page="meta.page" :limit="meta.limit" />

        <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
            <div class="text-sm text-muted">
                Total {{ meta.total }} production result(s)
            </div>

            <UPagination v-model:page="meta.page" :total="meta.total" :items-per-page="meta.limit"
                @update:page="fetchData" />
        </div>
        <ProductionResultFormModal v-model:open="showFormModal" :loading="submitLoading" :shifts="shifts"
            :stations="stations" :products="products" :production-wos="productionWos" :material-labels="materialLabels"
            :material-label-loading="materialLabelLoading" @select-production-wo="handleSelectProductionWo"
            @save="handleCreate" />
    </div>
</template>