<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

import Breadcrumbs from '../../../../components/Breadcrumbs.vue'
import { useMaterialReplacementStore } from '../../../../stores/production/material-replacement.store'
import { useAppToast } from '../../../../composables/useAppToast'

import MaterialReplacementFilters from './components/MaterialReplacementFilters.vue'
import MaterialReplacementTable from './components/MaterialReplacementTable.vue'
import productionMaterialControlService from '../../../../services/production/production-material-control.service'
import MaterialReplacementFormModal from './components/MaterialReplacementFormModal.vue'

const store = useMaterialReplacementStore()
const { replacements, meta, loading } = storeToRefs(store)
const { toastSuccess, toastError } = useAppToast()

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
    { label: 'Material Replacement' }
]
const showFormModal = ref(false)
const submitLoading = ref(false)

const productionResults = ref<any[]>([])
const bomMaterials = ref<any[]>([])
const bomLoading = ref(false)

async function fetchProductionResultsDropdown() {
  const res = await productionMaterialControlService.getProductionResults({
    page: 1,
    limit: 100,
    has_ng: true
  })

  productionResults.value = res.data.data || []
}

async function handleSelectProductionResult(productionResultId: number) {
  bomLoading.value = true

  try {
    const res = await productionMaterialControlService.getReplacementsByProductionResult(productionResultId)
    bomMaterials.value = res.data.data || []
  } finally {
    bomLoading.value = false
  }
}

async function handleCreate(data: any) {
    submitLoading.value = true

    try {
        const res = await store.createReplacement(data)

        toastSuccess(res?.data?.message || 'Replacement created successfully')

        showFormModal.value = false

        await fetchData()
        await fetchProductionResultsDropdown()
    } catch (err: any) {
        toastError(
            err?.response?.data?.message ||
            err?.message ||
            'Failed to create replacement'
        )
    } finally {
        submitLoading.value = false
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

    await store.fetchReplacements(params)
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
    fetchProductionResultsDropdown()
})
</script>

<template>
    <div class="p-6 space-y-6">
        <Breadcrumbs :items="breadcrumbItems" />

        <div>
            <h1 class="text-2xl font-bold">
                Material Replacement
            </h1>
            <p class="text-sm text-muted">
                Track replacement materials taken from station buffer for damaged production materials.
            </p>
        </div>

        <UButton icon="i-lucide-plus" label="Add Replacement" color="primary" @click="showFormModal = true" />

        <MaterialReplacementFilters :search="search" :filters="filters" @update:search="onUpdateSearch"
            @update:filters="onUpdateFilters" @reset="resetFilters" />

        <MaterialReplacementTable :data="replacements" :loading="loading" :page="meta.page" :limit="meta.limit" />

        <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
            <div class="text-sm text-muted">
                Total {{ meta.total }} replacement(s)
            </div>

            <UPagination v-model:page="meta.page" :total="meta.total" :items-per-page="meta.limit"
                @update:page="fetchData" />
        </div>
        <MaterialReplacementFormModal v-model:open="showFormModal" :loading="submitLoading"
            :production-results="productionResults" :bom-materials="bomMaterials" :bom-loading="bomLoading"
            @select-production-result="handleSelectProductionResult" @save="handleCreate" />
    </div>
</template>