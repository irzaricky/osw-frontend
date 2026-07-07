<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

import AnalyticsFilters from './components/AnalyticsFilters.vue'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ExecutiveSummaryCards from './components/ExecutiveSummaryCards.vue'
import ProductionTrendSection from './components/ProductionTrendSection.vue'
import WorkOrderStatusSection from './components/WorkOrderStatusSection.vue'
import QualityCharts from './components/QualityCharts.vue'
import DowntimeSection from './components/DowntimeSection.vue'
import LineEfficiencySection from './components/LineEfficiencySection.vue'
import ReschedulePerformanceSection from './components/ReschedulePerformanceSection.vue'
import IssueDetailsTable from './components/IssueDetailsTable.vue'

// Adjust these store imports/names to match your project's actual master data stores
import { useLineStore } from '../../../stores/master-data/line.store'
import { useShiftStore } from '../../../stores/master-data/shift.store'
import productionAnalyticsService from '../../../services/production-plan/analytics.service'

const lineStore = useLineStore()
const shiftStore = useShiftStore()

const { dropdown: lines } = storeToRefs(lineStore)
const { dropdown: shifts } = storeToRefs(shiftStore)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Production Plan' },
  { label: 'Analytics' }
]

const debouncedFetchAll = useDebounceFn(() => {
  fetchAll()
}, 300)

function onUpdateFilters(partial: Record<string, any>) {
  Object.assign(filters, partial)
  debouncedFetchAll()
}

const filters = reactive({
  date_from: '',
  date_to: '',
  line_id: undefined as number | undefined,
  shift_id: undefined as number | undefined,
  status: undefined as string | undefined
})

const executiveSummary = reactive<any>({})

const productionTrend = reactive<any[]>([])
const lineUtilization = reactive<any[]>([])
const workOrderStatus = reactive<any[]>([])
const outputQuality = reactive<any[]>([])
const downtimeByType = reactive<any[]>([])
const topDowntimeStations = reactive<any[]>([])
const defectByType = reactive<any[]>([])
const lineEfficiency = reactive<any[]>([])
const rescheduleFrequency = reactive<any[]>([])
const capacityFeasibility = reactive<any[]>([])
const issueDetails = ref<any[]>([])

const issueMeta = ref({
  page: 1,
  limit: 5,
  total: 0,
  total_pages: 0
})

const onTimeDelivery = ref({
  on_time: 0,
  late: 0,
  not_completed: 0
})

const loading = reactive({
  summary: false,
  trend: false,
  utilization: false,
  woStatus: false,
  quality: false,
  downtime: false,
  stations: false,
  defect: false,
  efficiency: false,
  delivery: false,
  reschedule: false,
  capacity: false,
  issues: false
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

const productionTrendChartOptions = computed(() => ({
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
    categories: productionTrend.map(row => row.production_date)
  },

  legend: {
    position: 'top'
  }
}))

const productionTrendChartSeries = computed(() => [
  {
    name: 'Planned Qty',
    data: productionTrend.map(row => row.planned_qty)
  },
  {
    name: 'Actual Qty',
    data: productionTrend.map(row => row.actual_qty)
  }
])

const lineUtilizationChartOptions = computed(() => ({
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
    categories: lineUtilization.map(row => row.line_name || '-')
  },

  yaxis: {
    max: 100
  }
}))

const lineUtilizationChartSeries = computed(() => [
  {
    name: 'Utilization %',
    data: lineUtilization.map(row => Number(row.avg_utilization_pct || 0))
  }
])

const workOrderStatusChartOptions = computed(() => ({
  labels: workOrderStatus.map(row => row.status),

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

const workOrderStatusChartSeries = computed(() =>
  workOrderStatus.map(row => row.total)
)

const onTimeDeliveryChartOptions = computed(() => ({
  labels: ['On Time', 'Late', 'Not Completed'],

  colors: ['#22c55e', '#ef4444', '#f59e0b'],

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

const onTimeDeliveryChartSeries = computed(() => [
  onTimeDelivery.value.on_time || 0,
  onTimeDelivery.value.late || 0,
  onTimeDelivery.value.not_completed || 0
])

const outputQualityChartOptions = computed(() => ({
  ...chartBaseOptions,

  chart: {
    ...chartBaseOptions.chart,
    type: 'bar',
    stacked: true
  },

  plotOptions: {
    bar: {
      borderRadius: 4
    }
  },

  xaxis: {
    ...chartBaseOptions.xaxis,
    categories: outputQuality.map(row => row.work_date)
  },

  legend: {
    position: 'top'
  }
}))

const outputQualityChartSeries = computed(() => [
  {
    name: 'Good',
    data: outputQuality.map(row => row.qty_good)
  },
  {
    name: 'Reject',
    data: outputQuality.map(row => row.qty_reject)
  },
  {
    name: 'Scrap',
    data: outputQuality.map(row => row.qty_scrap)
  }
])

const downtimeByTypeChartOptions = computed(() => ({
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
    categories: downtimeByType.map(row => row.issue_type)
  }
}))

const downtimeByTypeChartSeries = computed(() => [
  {
    name: 'Downtime Minutes',
    data: downtimeByType.map(row => row.total_downtime_minutes)
  }
])

const topDowntimeStationsChartOptions = computed(() => ({
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
    categories: topDowntimeStations.map(row => row.station_name)
  }
}))

const topDowntimeStationsChartSeries = computed(() => [
  {
    name: 'Downtime Minutes',
    data: topDowntimeStations.map(row => row.total_downtime_minutes)
  }
])

const defectByTypeChartOptions = computed(() => ({
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
    categories: defectByType.map(row => row.defect_type)
  }
}))

const defectByTypeChartSeries = computed(() => [
  {
    name: 'Defect Qty',
    data: defectByType.map(row => row.total_defect_qty)
  }
])

const lineEfficiencyChartOptions = computed(() => ({
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
    categories: lineEfficiency.map(row => row.line_name || '-')
  },

  yaxis: {
    max: 100
  }
}))

const lineEfficiencyChartSeries = computed(() => [
  {
    name: 'Efficiency %',
    data: lineEfficiency.map(row => Number(row.efficiency_pct || 0))
  }
])

const capacityFeasibilityChartOptions = computed(() => ({
  labels: capacityFeasibility.map(row => row.status),

  colors: ['#22c55e', '#ef4444'],

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

const capacityFeasibilityChartSeries = computed(() =>
  capacityFeasibility.map(row => row.total)
)

const rescheduleChartOptions = computed(() => ({
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
    categories: rescheduleFrequency.map(row => row.reschedule_date)
  },

  legend: {
    position: 'top'
  }
}))

const rescheduleChartSeries = computed(() => [
  {
    name: 'Reschedule Count',
    data: rescheduleFrequency.map(row => row.total_reschedules)
  },
  {
    name: 'Impacted Work Orders',
    data: rescheduleFrequency.map(row => row.total_impacted_wo)
  }
])

async function fetchExecutiveSummary() {
  loading.summary = true

  try {
    const res = await productionAnalyticsService.getExecutiveSummary(filters)
    Object.assign(executiveSummary, res.data.data || {})
  } finally {
    loading.summary = false
  }
}

async function fetchProductionTrend() {
  loading.trend = true

  try {
    const res = await productionAnalyticsService.getProductionTrend(filters)
    productionTrend.splice(0)
    productionTrend.push(...(res.data.data || []))
  } finally {
    loading.trend = false
  }
}

async function fetchLineUtilization() {
  loading.utilization = true

  try {
    const res = await productionAnalyticsService.getLineUtilization(filters)
    lineUtilization.splice(0)
    lineUtilization.push(...(res.data.data || []))
  } finally {
    loading.utilization = false
  }
}

async function fetchWorkOrderStatus() {
  loading.woStatus = true

  try {
    const res = await productionAnalyticsService.getWorkOrderStatus(filters)
    workOrderStatus.splice(0)
    workOrderStatus.push(...(res.data.data || []))
  } finally {
    loading.woStatus = false
  }
}

async function fetchOutputQuality() {
  loading.quality = true

  try {
    const res = await productionAnalyticsService.getOutputQuality(filters)
    outputQuality.splice(0)
    outputQuality.push(...(res.data.data || []))
  } finally {
    loading.quality = false
  }
}

async function fetchDowntimeByType() {
  loading.downtime = true

  try {
    const res = await productionAnalyticsService.getDowntimeByType(filters)
    downtimeByType.splice(0)
    downtimeByType.push(...(res.data.data || []))
  } finally {
    loading.downtime = false
  }
}

async function fetchTopDowntimeStations() {
  loading.stations = true

  try {
    const res = await productionAnalyticsService.getTopDowntimeStations(filters)
    topDowntimeStations.splice(0)
    topDowntimeStations.push(...(res.data.data || []))
  } finally {
    loading.stations = false
  }
}

async function fetchDefectByType() {
  loading.defect = true

  try {
    const res = await productionAnalyticsService.getDefectByType(filters)
    defectByType.splice(0)
    defectByType.push(...(res.data.data || []))
  } finally {
    loading.defect = false
  }
}

async function fetchLineEfficiency() {
  loading.efficiency = true

  try {
    const res = await productionAnalyticsService.getLineEfficiency(filters)
    lineEfficiency.splice(0)
    lineEfficiency.push(...(res.data.data || []))
  } finally {
    loading.efficiency = false
  }
}

async function fetchOnTimeDelivery() {
  loading.delivery = true

  try {
    const res = await productionAnalyticsService.getOnTimeDelivery(filters)

    if (res.data.status) {
      onTimeDelivery.value = res.data.data
    }
  } finally {
    loading.delivery = false
  }
}

async function fetchRescheduleFrequency() {
  loading.reschedule = true

  try {
    const res = await productionAnalyticsService.getRescheduleFrequency(filters)
    rescheduleFrequency.splice(0)
    rescheduleFrequency.push(...(res.data.data || []))
  } finally {
    loading.reschedule = false
  }
}

async function fetchCapacityFeasibility() {
  loading.capacity = true

  try {
    const res = await productionAnalyticsService.getCapacityFeasibility(filters)
    capacityFeasibility.splice(0)
    capacityFeasibility.push(...(res.data.data || []))
  } finally {
    loading.capacity = false
  }
}

async function fetchIssueDetails() {
  loading.issues = true

  try {
    const res = await productionAnalyticsService.getIssueDetails({
      ...filters,
      page: issueMeta.value.page,
      limit: issueMeta.value.limit
    })

    if (res.data.status) {
      issueDetails.value = res.data.data || []

      issueMeta.value = {
        page: res.data.pagination?.page || 1,
        limit: res.data.pagination?.limit || 5,
        total: res.data.pagination?.total || 0,
        total_pages: res.data.pagination?.total_pages || 0
      }
    }
  } finally {
    loading.issues = false
  }
}

function onUpdateIssuePage(page: number) {
  issueMeta.value.page = page
  fetchIssueDetails()
}

async function fetchAll() {
  await Promise.all([
    fetchExecutiveSummary(),
    fetchProductionTrend(),
    fetchLineUtilization(),
    fetchWorkOrderStatus(),
    fetchOutputQuality(),
    fetchDowntimeByType(),
    fetchTopDowntimeStations(),
    fetchDefectByType(),
    fetchLineEfficiency(),
    fetchOnTimeDelivery(),
    fetchRescheduleFrequency(),
    fetchCapacityFeasibility(),
    fetchIssueDetails()
  ])
}

onMounted(async () => {
  await Promise.all([
    lineStore.fetchDropdown(),
    shiftStore.fetchDropdown()
  ])
  await fetchAll()
})
</script>

<template>
  <UDashboardPanel id="analytics">
    <template #header>
      <UDashboardNavbar title="Production Planning & Control Analytics">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-5">
        <Breadcrumbs :items="breadcrumbItems" />

        <div>
          <h1 class="text-2xl font-bold">
            Production Planning & Control Analytics
          </h1>

          <p class="text-sm text-muted">
            Executive production performance and operational insights dashboard.
          </p>
        </div>

        <AnalyticsFilters :filters="filters" :lines="lines" :shifts="shifts" @update:filters="onUpdateFilters" />

        <ExecutiveSummaryCards :executive-summary="executiveSummary" />

        <ProductionTrendSection
          :production-trend-chart-options="productionTrendChartOptions"
          :production-trend-chart-series="productionTrendChartSeries"
          :line-utilization-chart-options="lineUtilizationChartOptions"
          :line-utilization-chart-series="lineUtilizationChartSeries"
        />

        <WorkOrderStatusSection
          :work-order-status-chart-options="workOrderStatusChartOptions"
          :work-order-status-chart-series="workOrderStatusChartSeries"
          :on-time-delivery-chart-options="onTimeDeliveryChartOptions"
          :on-time-delivery-chart-series="onTimeDeliveryChartSeries"
          :on-time-delivery="onTimeDelivery"
        />

        <QualityCharts
          :output-quality-chart-options="outputQualityChartOptions"
          :output-quality-chart-series="outputQualityChartSeries"
          :defect-by-type-chart-options="defectByTypeChartOptions"
          :defect-by-type-chart-series="defectByTypeChartSeries"
        />

        <DowntimeSection
          :downtime-by-type-chart-options="downtimeByTypeChartOptions"
          :downtime-by-type-chart-series="downtimeByTypeChartSeries"
          :top-downtime-stations-chart-options="topDowntimeStationsChartOptions"
          :top-downtime-stations-chart-series="topDowntimeStationsChartSeries"
        />

        <LineEfficiencySection
          :line-efficiency-chart-options="lineEfficiencyChartOptions"
          :line-efficiency-chart-series="lineEfficiencyChartSeries"
          :capacity-feasibility-chart-options="capacityFeasibilityChartOptions"
          :capacity-feasibility-chart-series="capacityFeasibilityChartSeries"
        />

        <ReschedulePerformanceSection
          :reschedule-chart-options="rescheduleChartOptions"
          :reschedule-chart-series="rescheduleChartSeries"
        />

        <IssueDetailsTable
          :issue-details="issueDetails"
          :issue-meta="issueMeta"
          @update:issue-page="onUpdateIssuePage"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>