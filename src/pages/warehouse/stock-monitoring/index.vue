<script setup lang="ts">
import { onMounted, ref, computed, reactive, watch } from 'vue'
import { storeToRefs } from 'pinia'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import { useStockMonitoringStore } from '../../../stores/warehouse/stock-monitoring.store'

import StockSummaryCards from './components/StockSummaryCards.vue'
import StockPartTable from './components/StockPartTable.vue'
import StockBinTable from './components/StockBinTable.vue'
import * as XLSX from 'xlsx'

import { useDebounceFn } from '@vueuse/core'
import { useWarehouseAreaStore } from '../../../stores/master-data/warehouse-area.store'
import HomeDateRangePicker from '../../../components/home/HomeDateRangePicker.vue'

type DateRangeValue = {
  start?: Date
  end?: Date
}

const stockMonitoringStore = useStockMonitoringStore()
const {
  summary,
  parts,
  bins,
  partLabels,
  binStocks,
  loading
} = storeToRefs(stockMonitoringStore)

const warehouseAreaStore = useWarehouseAreaStore()
const { dropdown: warehouseAreas } = storeToRefs(warehouseAreaStore)

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

const exporting = ref(false)

const filters = reactive({
  warehouse_area_id: undefined as number | undefined,
  status: undefined as string | undefined,
  part_category: undefined as string | undefined,
  date_from: undefined as string | undefined,
  date_to: undefined as string | undefined,
  low_stock_only: false,
  aging_only: false,
  low_capacity_only: false
})

function formatDate(date?: Date) {
  if (!date) return undefined

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function parseDate(value?: string) {
  if (!value) return undefined

  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const dateRange = computed<DateRangeValue>({
  get() {
    return {
      start: parseDate(filters.date_from),
      end: parseDate(filters.date_to)
    }
  },
  set(value) {
    filters.date_from = formatDate(value?.start)
    filters.date_to = formatDate(value?.end)
  }
})

const selectedWarehouseArea = computed({
  get() {
    if (filters.warehouse_area_id == null) return undefined
    return warehouseAreas.value.find(area => area.id === filters.warehouse_area_id)?.name
  },
  set(value: string | undefined) {
    filters.warehouse_area_id = value
      ? warehouseAreas.value.find(area => area.name === value)?.id
      : undefined
  }
})

const selectedPartCategory = computed({
  get() {
    return filters.part_category || undefined
  },
  set(value: string | undefined) {
    filters.part_category = value || undefined
  }
})

const selectedStatus = computed({
  get() {
    return filters.status || undefined
  },
  set(value: string | undefined) {
    filters.status = value || undefined
  }
})

const statusItems = [
  { label: 'Empty', value: 'Empty' },
  { label: 'Available', value: 'Available' },
  { label: 'Full', value: 'Full' }
]

const categoryItems = [
  { label: 'Small Part', value: 'Small Part' },
  { label: 'Big Part', value: 'Big Part' }
]

const debouncedFetch = useDebounceFn(() => {
  fetchData()
}, 300)

watch(search, () => debouncedFetch())

watch(filters, () => {
  fetchData()
}, { deep: true })

watch(activeTab, () => {
  fetchData()
})

async function fetchData() {
  const params: Record<string, any> = {}

  if (search.value) params.search = search.value
  if (filters.warehouse_area_id) params.warehouse_area_id = filters.warehouse_area_id
  if (filters.date_from) params.date_from = filters.date_from
  if (filters.date_to) params.date_to = filters.date_to

  if (activeTab.value === 'parts') {
    if (filters.part_category) params.part_category = filters.part_category
    if (filters.low_stock_only) params.low_stock_only = true
    if (filters.aging_only) params.aging_only = true

    await Promise.all([
      stockMonitoringStore.fetchSummary(),
      stockMonitoringStore.fetchParts(params)
    ])
  } else {
    if (filters.status) params.status = filters.status
    if (filters.low_capacity_only) params.low_capacity_only = true

    await Promise.all([
      stockMonitoringStore.fetchSummary(),
      stockMonitoringStore.fetchBins(params)
    ])
  }
}

function handleSummaryCardClick(type: string) {
  filters.low_stock_only = false
  filters.aging_only = false
  filters.low_capacity_only = false
  filters.status = undefined
  filters.part_category = undefined

  if (type === 'low_stock') {
    activeTab.value = 'parts'
    filters.low_stock_only = true
    fetchData()
    return
  }

  if (type === 'aging') {
    activeTab.value = 'parts'
    filters.aging_only = true
    fetchData()
    return
  }

  if (type === 'all_parts') {
    activeTab.value = 'parts'
    fetchData()
    return
  }

  if (type === 'occupied_bins') {
    activeTab.value = 'bins'
    filters.status = 'Available'
    fetchData()
    return
  }

  if (type === 'full_bins') {
    activeTab.value = 'bins'
    filters.status = 'Full'
    fetchData()
    return
  }

  if (type === 'empty_bins') {
    activeTab.value = 'bins'
    filters.status = 'Empty'
    fetchData()
    return
  }

  if (type === 'low_capacity') {
    activeTab.value = 'bins'
    filters.low_capacity_only = true
    fetchData()
  }
}

function resetFilters() {
  search.value = ''
  filters.warehouse_area_id = undefined
  filters.status = undefined
  filters.part_category = undefined
  filters.low_stock_only = false
  filters.aging_only = false
  filters.low_capacity_only = false
  fetchData()
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

function createSheet(rows: Record<string, any>[]) {
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Info: 'No data' }])

  ws['!cols'] = Object.keys(rows[0] || { Info: 'No data' }).map(key => ({
    wch: Math.max(
      key.length,
      ...rows.map(row => String(row[key] ?? '').length)
    ) + 5
  }))

  return ws
}

async function loadAllExportDetails() {
  await Promise.all([
    ...parts.value.map(part => stockMonitoringStore.fetchPartLabels(part.part_number)),
    ...bins.value.map(bin => stockMonitoringStore.fetchBinStocks(bin.bin_id))
  ])
}

async function exportStockMonitoring() {
  exporting.value = true

  try {
    await loadAllExportDetails()

    const workbook = XLSX.utils.book_new()

    const summaryPartRows = filteredParts.value.map((row, index) => ({
      No: index + 1,
      'Part Number': row.part_number,
      'Part Name': row.part_name,
      Category: row.part_category || '-',
      Package: row.package_name || row.package_code || '-',
      'Capacity / Kanban': row.capacity_per_kanban,
      'Total Kanban': row.total_kanban,
      'Safety Stock': row.safety_stock,
      'Coverage (%)': row.coverage_percentage,
      'Stock Status': row.stock_status,
      'Total PCS': row.total_pcs,
      'Total Bin': row.total_bins,
      'Oldest Stock': row.oldest_stock_at ? new Date(row.oldest_stock_at).toLocaleString() : '-',
      'Latest Stock': row.latest_stock_at ? new Date(row.latest_stock_at).toLocaleString() : '-'
    }))

    const summaryBinRows = filteredBins.value.map((row, index) => ({
      No: index + 1,
      'Bin Code': row.bin_code,
      'Warehouse Area': row.warehouse_area || '-',
      Status: row.status,
      Capacity: row.capacity,
      Used: row.used_capacity,
      Remaining: row.remaining_capacity,
      'Part Variant': row.total_part_variant,
      'Total Kanban': row.total_kanban,
      'Total PCS': row.total_pcs,
      Dedicated: row.is_dedicated ? 'Yes' : 'No',
      'Dedicated Part': row.dedicated_part_number || '-'
    }))

    const labelDetailRows = Object.values(partLabels.value)
      .flat()
      .map((row, index) => ({
        No: index + 1,
        'Label Number': row.label_number,
        'Part Number': row.part_number,
        'Part Name': row.part_name,
        'Bin Code': row.bin_code,
        'Warehouse Area': row.warehouse_area || '-',
        'Qty / Kanban': row.qty_per_kanban,
        'Placement At': row.placement_date ? new Date(row.placement_date).toLocaleString() : '-'
      }))

    const binContentRows = Object.entries(binStocks.value)
      .flatMap(([binId, stocks]) => {
        const bin = bins.value.find(item => String(item.bin_id) === String(binId))

        return stocks.map(stock => ({
          'Bin Code': bin?.bin_code || '-',
          'Warehouse Area': bin?.warehouse_area || '-',
          'Label Number': stock.label_number,
          'Part Number': stock.part_number,
          'Part Name': stock.part_name,
          'Qty / Kanban': stock.qty_per_kanban,
          'Placement At': stock.placement_date ? new Date(stock.placement_date).toLocaleString() : '-'
        }))
      })
      .map((row, index) => ({
        No: index + 1,
        ...row
      }))

    XLSX.utils.book_append_sheet(workbook, createSheet(summaryPartRows), 'Summary Part')
    XLSX.utils.book_append_sheet(workbook, createSheet(summaryBinRows), 'Summary Bin')
    XLSX.utils.book_append_sheet(workbook, createSheet(labelDetailRows), 'Label Detail')
    XLSX.utils.book_append_sheet(workbook, createSheet(binContentRows), 'Bin Content')

    XLSX.writeFile(workbook, `stock-monitoring-${Date.now()}.xlsx`)
  } catch (error) {
    console.error(error)
  } finally {
    exporting.value = false
  }
}

onMounted(async () => {
  await warehouseAreaStore.fetchDropdown()
  await fetchData()
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

    <StockSummaryCards :summary="summary" @click-card="handleSummaryCardClick" />

    <UCard>
      <div class="flex flex-col gap-4">
        <div class="flex flex-col md:flex-row md:items-center gap-3">
          <UInput v-model="search" icon="i-lucide-search" placeholder="Search part / bin / area..."
            class="w-full md:w-80" />

          <div class="w-full md:w-64">
            <HomeDateRangePicker v-model="dateRange as any" clear />
          </div>

          <USelectMenu v-model="selectedWarehouseArea" :items="warehouseAreas.map(area => area.name)"
            placeholder="Warehouse Area" class="w-full md:w-64" searchable clear />

          <USelectMenu v-if="activeTab === 'parts'" v-model="selectedPartCategory" placeholder="Part Category"
            :items="categoryItems.map(item => item.label)" class="w-full md:w-48" searchable clear />

          <USelectMenu v-if="activeTab === 'bins'" v-model="selectedStatus" placeholder="Bin Status"
            :items="statusItems.map(item => item.label)" class="w-full md:w-48" searchable clear />

          <UButton icon="i-lucide-download" color="primary" variant="soft" label="Export Excel" :loading="exporting"
            @click="exportStockMonitoring" />
        </div>

        <UTabs v-model="activeTab" :items="tabItems" class="w-full" />
      </div>
    </UCard>

    <StockPartTable v-if="activeTab === 'parts'" :parts="filteredParts" :labels-map="partLabels" :loading="loading"
      @expand-part="expandPart" />

    <StockBinTable v-else :bins="filteredBins" :stocks-map="binStocks" :loading="loading" @expand-bin="expandBin" />
  </div>
</template>