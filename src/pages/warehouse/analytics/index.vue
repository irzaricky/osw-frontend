<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'

import AnalyticsFilters from './components/AnalyticsFilters.vue'
import ExecutiveSummaryCards from './components/ExecutiveSummaryCards.vue'
import InventoryHealthSection from './components/InventoryHealthSection.vue'
import CriticalPartsTable from './components/CriticalPartsTable.vue'
import FifoAnalyticsSection from './components/FifoAnalyticsSection.vue'
import MovementCharts from './components/MovementCharts.vue'
import InventoryValueCharts from './components/InventoryValueCharts.vue'
import BehaviorCharts from './components/BehaviorCharts.vue'

import { useWarehouseAreaStore } from '../../../stores/master-data/warehouse-area.store'
import warehouseAnalyticsService from '../../../services/warehouse/analytics.service'

const warehouseAreaStore = useWarehouseAreaStore()

const { dropdown: warehouseAreas } = storeToRefs(warehouseAreaStore)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Warehouse' },
  { label: 'Analytics' }
]

const filters = reactive({
  date_from: '',
  date_to: '',
  warehouse_area_id: undefined as number | undefined,
  part_category: undefined as string | undefined,
  movement_type: undefined as string | undefined,
  part_number: ''
})

const executiveSummary = reactive<any>({})

const inventoryValue = reactive<any>({
  summary: {},
  by_area: []
})

const inventoryHealth = ref({
  out_of_stock: 0,
  critical_stock: 0,
  below_safety: 0,
  safe_stock: 0,
  overstock: 0
})

const criticalParts = reactive<any[]>([])

const stockMovement = reactive<any[]>([])
const fastMoving = reactive<any[]>([])
const slowMoving = reactive<any[]>([])
const utilization = reactive<any[]>([])
const topInventoryValue = reactive<any[]>([])

const fifoCompliance = ref({
  fifo_compliant: 0,
  fifo_override: 0,
  total_takeout: 0,
  fifo_compliance_rate: 0
})

const agingDistribution = ref({
  fresh_stock: 0,
  medium_stock: 0,
  old_stock: 0
})

const loading = reactive({
  summary: false,
  movement: false,
  fast: false,
  slow: false,
  utilization: false,
  inventoryValue: false,
  topInventoryValue: false,
  inventoryHealth: false,
  criticalParts: false
})

const utilizationPercentage = computed(() => {
  return Number(executiveSummary.utilization_percentage || 0)
})

const chartBaseOptions = {
  theme: {
    mode: 'dark'
  },

  chart: {
    background: 'transparent',
    foreColor: '#a1a1aa',
    toolbar: {
      show: false
    }
  },

  grid: {
    borderColor: '#27272a'
  },

  tooltip: {
    theme: 'dark'
  },

  dataLabels: {
    style: {
      colors: ['#ffffff']
    }
  },

  xaxis: {
    labels: {
      style: {
        colors: '#a1a1aa'
      }
    },

    axisBorder: {
      color: '#3f3f46'
    },

    axisTicks: {
      color: '#3f3f46'
    }
  },

  yaxis: {
    labels: {
      style: {
        colors: '#a1a1aa'
      }
    }
  }
}

const movementChartOptions = computed(() => ({
  ...chartBaseOptions,

  chart: {
    ...chartBaseOptions.chart,
    type: 'line'
  },

  stroke: {
    curve: 'smooth',
    width: 3
  },

  xaxis: {
    ...chartBaseOptions.xaxis,

    categories: stockMovement.map(
      row => row.movement_date
    )
  },

  legend: {
    position: 'top'
  }
}))

const movementChartSeries = computed(() => [
  {
    name: 'Placement',
    data: stockMovement.map(row => row.placement)
  },
  {
    name: 'Take Out',
    data: stockMovement.map(row => row.take_out)
  }
])

const fastMovingChartOptions = computed(() => ({
  ...chartBaseOptions,

  chart: {
    ...chartBaseOptions.chart,
    type: 'bar'
  },

  plotOptions: {
    bar: {
      borderRadius: 6,
      horizontal: true
    }
  },

  xaxis: {
    ...chartBaseOptions.xaxis,

    categories: fastMoving.map(
      row => row.part_number
    )
  }
}))

const fastMovingChartSeries = computed(() => [
  {
    name: 'Take Out Count',
    data: fastMoving.map(row => row.movement_count)
  }
])

const slowMovingChartOptions = computed(() => ({
  ...chartBaseOptions,

  chart: {
    ...chartBaseOptions.chart,
    type: 'bar'
  },

  plotOptions: {
    bar: {
      borderRadius: 6,
      horizontal: true
    }
  },

  xaxis: {
    ...chartBaseOptions.xaxis,

    categories: slowMoving.map(
      row => row.part_number
    )
  }
}))

const slowMovingChartSeries = computed(() => [
  {
    name: 'Aging Days',
    data: slowMoving.map(row => row.oldest_aging_days)
  }
])

const utilizationChartOptions = computed(() => ({
  ...chartBaseOptions,

  chart: {
    ...chartBaseOptions.chart,
    type: 'bar'
  },

  plotOptions: {
    bar: {
      borderRadius: 6
    }
  },

  xaxis: {
    ...chartBaseOptions.xaxis,

    categories: utilization.map(
      row => row.warehouse_area
    )
  },

  yaxis: {
    max: 100
  }
}))

const utilizationChartSeries = computed(() => [
  {
    name: 'Utilization %',
    data: utilization.map(
      row => Number(row.utilization_percentage || 0)
    )
  }
])

const agingChartOptions = computed(() => ({
  labels: [
    '0-7 Days',
    '8-30 Days',
    '>30 Days'
  ],

  legend: {
    position: 'bottom'
  }
}))

const agingChartSeries = computed(() => [
  agingDistribution.value.fresh_stock || 0,
  agingDistribution.value.medium_stock || 0,
  agingDistribution.value.old_stock || 0
])

const inventoryValueByAreaChartOptions = computed(() => ({
  ...chartBaseOptions,

  chart: {
    ...chartBaseOptions.chart,
    type: 'bar'
  },

  plotOptions: {
    bar: {
      borderRadius: 6
    }
  },

  xaxis: {
    ...chartBaseOptions.xaxis,

    categories: inventoryValue.by_area.map(
      (row: any) => row.warehouse_area || '-'
    )
  },

  yaxis: {
    labels: {
      formatter: (value: number) =>
        `Rp ${Math.round(value / 1000000)} jt`
    }
  }
}))

const inventoryValueByAreaChartSeries = computed(() => [
  {
    name: 'Inventory Value',
    data: inventoryValue.by_area.map(
      (row: any) => Number(row.inventory_value || 0)
    )
  }
])

const topInventoryValueChartOptions = computed(() => ({
  ...chartBaseOptions,

  chart: {
    ...chartBaseOptions.chart,
    type: 'bar'
  },

  plotOptions: {
    bar: {
      borderRadius: 6,
      horizontal: true
    }
  },

  xaxis: {
    ...chartBaseOptions.xaxis,

    categories: topInventoryValue.map(
      row => row.part_number
    )
  }
}))

const topInventoryValueChartSeries = computed(() => [
  {
    name: 'Inventory Value',
    data: topInventoryValue.map(
      row => Number(row.inventory_value || 0)
    )
  }
])

const inventoryHealthChartOptions = computed(() => ({
  ...chartBaseOptions,

  labels: [
    'Out of Stock',
    'Critical',
    'Below Safety',
    'Safe',
    'Overstock'
  ],

  legend: {
    position: 'bottom',

    labels: {
      colors: '#a1a1aa'
    }
  },

  tooltip: {
    theme: 'dark'
  }
}))

const inventoryHealthChartSeries = computed(() => [
  inventoryHealth.value.out_of_stock || 0,
  inventoryHealth.value.critical_stock || 0,
  inventoryHealth.value.below_safety || 0,
  inventoryHealth.value.safe_stock || 0,
  inventoryHealth.value.overstock || 0
])

async function fetchExecutiveSummary() {
  loading.summary = true

  try {
    const res = await warehouseAnalyticsService.getExecutiveSummary(filters)

    Object.assign(executiveSummary, res.data.data || {})
  } finally {
    loading.summary = false
  }
}

async function fetchStockMovement() {
  loading.movement = true

  try {
    const res = await warehouseAnalyticsService.getStockMovement(filters)

    stockMovement.splice(0)
    stockMovement.push(...(res.data.data || []))
  } finally {
    loading.movement = false
  }
}

async function fetchFastMoving() {
  loading.fast = true

  try {
    const res = await warehouseAnalyticsService.getFastMoving(filters)

    fastMoving.splice(0)
    fastMoving.push(...(res.data.data || []))
  } finally {
    loading.fast = false
  }
}

async function fetchSlowMoving() {
  loading.slow = true

  try {
    const res = await warehouseAnalyticsService.getSlowMoving(filters)

    slowMoving.splice(0)
    slowMoving.push(...(res.data.data || []))
  } finally {
    loading.slow = false
  }
}

async function fetchUtilization() {
  loading.utilization = true

  try {
    const res = await warehouseAnalyticsService.getUtilization(filters)

    utilization.splice(0)
    utilization.push(...(res.data.data || []))
  } finally {
    loading.utilization = false
  }
}

async function fetchInventoryValue() {
  loading.inventoryValue = true

  try {
    const res = await warehouseAnalyticsService.getInventoryValue(filters)

    Object.assign(
      inventoryValue.summary,
      res.data.data?.summary || {}
    )

    inventoryValue.by_area.splice(0)
    inventoryValue.by_area.push(
      ...(res.data.data?.by_area || [])
    )
  } finally {
    loading.inventoryValue = false
  }
}

async function fetchTopInventoryValue() {
  loading.topInventoryValue = true

  try {
    const res = await warehouseAnalyticsService.getTopInventoryValue(filters)

    topInventoryValue.splice(0)
    topInventoryValue.push(...(res.data.data || []))
  } finally {
    loading.topInventoryValue = false
  }
}

async function fetchInventoryHealth() {
  loading.inventoryHealth = true

  try {
    const res = await warehouseAnalyticsService.getInventoryHealth(filters)

    if (res.data.status) {
      inventoryHealth.value = res.data.data
    }
  } finally {
    loading.inventoryHealth = false
  }
}

async function fetchCriticalParts() {
  loading.criticalParts = true

  try {
    const res = await warehouseAnalyticsService.getCriticalParts(filters)

    criticalParts.splice(0)
    criticalParts.push(...(res.data.data || []))
  } finally {
    loading.criticalParts = false
  }
}

async function fetchFifoCompliance() {
  const response = await warehouseAnalyticsService.getFifoCompliance(filters)

  if (response.data.status) {
    fifoCompliance.value = {
      ...response.data.data,

      fifo_compliance_rate: Number(
        response.data.data.fifo_compliance_rate || 0
      )
    }
  }
}

async function fetchAgingDistribution() {
  const response = await warehouseAnalyticsService.getAgingDistribution(filters)

  if (response.data.status) {
    agingDistribution.value = response.data.data
  }
}

async function fetchAll() {
  await Promise.all([
    fetchExecutiveSummary(),
    fetchStockMovement(),
    fetchFastMoving(),
    fetchSlowMoving(),
    fetchUtilization(),
    fetchInventoryValue(),
    fetchTopInventoryValue(),
    fetchInventoryHealth(),
    fetchCriticalParts(),
    fetchFifoCompliance(),
    fetchAgingDistribution()
  ])
}

function resetFilters() {
  filters.date_from = ''
  filters.date_to = ''
  filters.warehouse_area_id = undefined
  filters.part_category = undefined
  filters.movement_type = undefined
  filters.part_number = ''

  fetchAll()
}

onMounted(async () => {
  await warehouseAreaStore.fetchDropdown()
  await fetchAll()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div>
      <h1 class="text-2xl font-bold">
        Warehouse Analytics
      </h1>

      <p class="text-sm text-muted">
        Executive warehouse analytics and operational insights dashboard.
      </p>
    </div>

    <AnalyticsFilters
      :filters="filters"
      :warehouse-areas="warehouseAreas"
      @apply="fetchAll"
      @reset="resetFilters"
    />

    <ExecutiveSummaryCards
      :executive-summary="executiveSummary"
      :inventory-value="inventoryValue"
      :utilization-percentage="utilizationPercentage"
    />

    <InventoryHealthSection
      :inventory-health="inventoryHealth"
      :chart-options="inventoryHealthChartOptions"
      :chart-series="inventoryHealthChartSeries"
    />

    <CriticalPartsTable
      :parts="criticalParts"
      :loading="loading.criticalParts"
    />

    <FifoAnalyticsSection
      :fifo-compliance="fifoCompliance"
      :aging-chart-options="agingChartOptions"
      :aging-chart-series="agingChartSeries"
    />

    <MovementCharts
      :movement-chart-options="movementChartOptions"
      :movement-chart-series="movementChartSeries"
      :utilization-chart-options="utilizationChartOptions"
      :utilization-chart-series="utilizationChartSeries"
    />

    <InventoryValueCharts
      :inventory-value-by-area-chart-options="inventoryValueByAreaChartOptions"
      :inventory-value-by-area-chart-series="inventoryValueByAreaChartSeries"
      :top-inventory-value-chart-options="topInventoryValueChartOptions"
      :top-inventory-value-chart-series="topInventoryValueChartSeries"
    />

    <BehaviorCharts
      :fast-moving-chart-options="fastMovingChartOptions"
      :fast-moving-chart-series="fastMovingChartSeries"
      :slow-moving-chart-options="slowMovingChartOptions"
      :slow-moving-chart-series="slowMovingChartSeries"
    />
  </div>
</template>