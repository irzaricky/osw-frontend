<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

import Breadcrumbs from '../../../../components/Breadcrumbs.vue'
import type { Range } from '../../../../types'

import { useScrapCrusherStore } from '../../../../stores/production/scrap-crusher.store'
import productionMaterialControlService from '../../../../services/production/production-material-control.service'

import ScrapCrusherFilters from './components/ScrapCrusherFilters.vue'
import ScrapCrusherTable from './components/ScrapCrusherTable.vue'
import ScrapCrusherFormModal from './components/ScrapCrusherFormModal.vue'

const store = useScrapCrusherStore()
const { scraps, meta, loading } = storeToRefs(store)

const search = ref('')
const dateRange = ref<Range | undefined>()

const showFormModal = ref(false)
const submitLoading = ref(false)

const productionResults = ref<any[]>([])
const replacementMaterials = ref<any[]>([])
const replacementLoading = ref(false)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Production' },
  { label: 'Production Material Control' },
  { label: 'Scrap / Crusher' }
]

async function fetchProductionResultsDropdown() {
  const res = await productionMaterialControlService.getProductionResults({
    page: 1,
    limit: 100,
    has_ng: true
  })

  productionResults.value = res.data.data || []
}

async function handleSelectProductionResult(productionResultId: number) {
  replacementLoading.value = true

  try {
    const res = await productionMaterialControlService.getReplacementsByProductionResult(productionResultId)
    replacementMaterials.value = res.data.data || []
  } finally {
    replacementLoading.value = false
  }
}

async function handleCreate(data: any) {
  submitLoading.value = true

  try {
    await store.createScrap(data)
    showFormModal.value = false
    await fetchData()
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

  if (dateRange.value?.start) {
    params.date_from = dateRange.value.start.toISOString().slice(0, 10)
  }

  if (dateRange.value?.end) {
    params.date_to = dateRange.value.end.toISOString().slice(0, 10)
  }

  await store.fetchScraps(params)
}

function onUpdateSearch(value: string) {
  search.value = value
}

function onUpdateDateRange(value: Range | undefined) {
  dateRange.value = value
}

function resetFilters() {
  search.value = ''
  dateRange.value = undefined
  meta.value.page = 1
  fetchData()
}

const debouncedFetch = useDebounceFn(() => {
  meta.value.page = 1
  fetchData()
}, 300)

watch(search, () => debouncedFetch())

watch(dateRange, () => {
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

    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">
          Scrap / Crusher
        </h1>
        <p class="text-sm text-muted">
          Track damaged materials and calculate crusher weight.
        </p>
      </div>
    </div>

    <UButton icon="i-lucide-plus" label="Add Scrap" color="primary" @click="showFormModal = true" />

    <ScrapCrusherFilters :search="search" :date-range="dateRange" @update:search="onUpdateSearch"
      @update:date-range="onUpdateDateRange" @reset="resetFilters" />

    <ScrapCrusherTable :data="scraps" :loading="loading" :page="meta.page" :limit="meta.limit" />

    <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
      <div class="text-sm text-muted">
        Total {{ meta.total }} scrap record(s)
      </div>

      <UPagination v-model:page="meta.page" :total="meta.total" :items-per-page="meta.limit" @update:page="fetchData" />
    </div>

    <ScrapCrusherFormModal v-model:open="showFormModal" :loading="submitLoading" :production-results="productionResults"
      :replacement-materials="replacementMaterials" :replacement-loading="replacementLoading"
      @select-production-result="handleSelectProductionResult" @save="handleCreate" />
  </div>
</template>