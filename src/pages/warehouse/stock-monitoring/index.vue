<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import { useStockMonitoringStore } from '../../../stores/warehouse/stock-monitoring.store'

import StockSummaryCards from './components/StockSummaryCards.vue'
import StockPartTable from './components/StockPartTable.vue'
import StockBinTable from './components/StockBinTable.vue'

const stockMonitoringStore = useStockMonitoringStore()
const {
  summary,
  parts,
  bins,
  partLabels,
  binStocks,
  loading
} = storeToRefs(stockMonitoringStore)

const activeTab = ref<'parts' | 'bins'>('parts')
const search = ref('')

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Warehouse' },
  { label: 'Stock Monitoring' }
]

const tabItems = [
  { label: 'Stock by Part', value: 'parts', icon: 'i-lucide-package' },
  { label: 'Stock by Storage Bin', value: 'bins', icon: 'i-lucide-warehouse' }
]

const filteredParts = computed(() => {
  if (!search.value) return parts.value
  const keyword = search.value.toLowerCase()

  return parts.value.filter(part =>
    [part.part_number, part.part_name, part.part_category, part.package_name, part.package_code]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(keyword))
  )
})

const filteredBins = computed(() => {
  if (!search.value) return bins.value
  const keyword = search.value.toLowerCase()

  return bins.value.filter(bin =>
    [bin.bin_code, bin.warehouse_area, bin.status, bin.dedicated_part_number]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(keyword))
  )
})

async function fetchData() {
  await Promise.all([
    stockMonitoringStore.fetchSummary(),
    stockMonitoringStore.fetchParts(),
    stockMonitoringStore.fetchBins()
  ])
}

async function expandPart(partNumber: string) {
  if (!partLabels.value[partNumber]) {
    await stockMonitoringStore.fetchPartLabels(partNumber)
  }
}

async function expandBin(binId: number) {
  const key = String(binId)
  if (!binStocks.value[key]) {
    await stockMonitoringStore.fetchBinStocks(binId)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div>
      <h1 class="text-2xl font-bold">
        Stock Monitoring
      </h1>
      <p class="text-sm text-muted">
        Monitor active warehouse stock by part, label, and storage bin.
      </p>
    </div>

    <StockSummaryCards :summary="summary" />

    <UCard>
      <div class="flex flex-col md:flex-row md:items-center gap-3">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search part / bin / area..."
          class="w-full md:w-80"
        />

        <div class="ml-auto">
          <UTabs
            v-model="activeTab"
            :items="tabItems"
          />
        </div>
      </div>
    </UCard>

    <StockPartTable
      v-if="activeTab === 'parts'"
      :parts="filteredParts"
      :labels-map="partLabels"
      :loading="loading"
      @expand-part="expandPart"
    />

    <StockBinTable
      v-else
      :bins="filteredBins"
      :stocks-map="binStocks"
      :loading="loading"
      @expand-bin="expandBin"
    />
  </div>
</template>