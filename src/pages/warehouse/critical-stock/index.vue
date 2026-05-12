<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import { useStockMonitoringStore } from '../../../stores/warehouse/stock-monitoring.store'
import StockPartTable from '../stock-monitoring/components/StockPartTable.vue'

const stockMonitoringStore = useStockMonitoringStore()

const {
  parts,
  partLabels,
  loading
} = storeToRefs(stockMonitoringStore)

const search = ref('')

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Warehouse' },
  { label: 'Critical Stock' }
]

const filteredParts = computed(() => {
  if (!search.value) return parts.value

  const keyword = search.value.toLowerCase()

  return parts.value.filter(part =>
    [
      part.part_number,
      part.part_name,
      part.part_category,
      part.package_name,
      part.package_code
    ]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(keyword))
  )
})

async function fetchData() {
  await stockMonitoringStore.fetchParts({
    stock_status: 'Critical'
  })
}

async function expandPart(partNumber: string) {
  if (!partLabels.value[partNumber]) {
    await stockMonitoringStore.fetchPartLabels(partNumber)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">
          Critical Stock
        </h1>
        <p class="text-sm text-muted">
          List of parts with stock coverage less than or equal to 50% of safety stock.
        </p>
      </div>

      <UBadge color="error" variant="soft">
        {{ filteredParts.length }} Critical Part(s)
      </UBadge>
    </div>

    <UCard>
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search critical part..."
        class="w-full md:w-96"
      />
    </UCard>

    <StockPartTable
      :parts="filteredParts"
      :labels-map="partLabels"
      :loading="loading"
      @expand-part="expandPart"
    />
  </div>
</template>