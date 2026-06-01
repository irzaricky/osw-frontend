<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import dayjs from 'dayjs'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import HomeDateRangePicker from '../../../components/home/HomeDateRangePicker.vue'
import ForecastTab from './components/ForecastTab.vue'
import SprTab from './components/SprTab.vue'
import SpoTab from './components/SpoTab.vue'
import SdpTab from './components/SdpTab.vue'

// Import old components for other tabs
import ForecastVsSpoChart from '../analytics-old/components/ForecastVsSpoChart.vue'
import TopCustomersChart from '../analytics-old/components/TopCustomersChart.vue'

import { useSalesAnalyticsStore } from '../../../stores/sales/analytics.store'

const salesAnalyticsStore = useSalesAnalyticsStore()
const { summary, slaMetrics, forecastVsSpo, topCustomers, loading, error, filters } = storeToRefs(salesAnalyticsStore)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Sales' },
  { label: 'Analytics' }
]

type DateRangeValue = {
  start?: Date
  end?: Date
}

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
      start: parseDate(filters.value.start_date),
      end: parseDate(filters.value.end_date)
    }
  },
  set(value) {
    filters.value.start_date = formatDate(value?.start) || ''
    filters.value.end_date = formatDate(value?.end) || ''
    debouncedFetch()
  }
})

const debouncedFetch = useDebounceFn(() => {
  fetchData()
}, 300)

// Active Tab
const activeTab = ref<'forecast' | 'spr' | 'spo' | 'sdp' | 'sdo'>('forecast')

const tabItems = [
  { label: 'Forecast Analytics', value: 'forecast', icon: 'i-lucide-trending-up' },
  { label: 'SPR Analytics', value: 'spr', icon: 'i-lucide-file-text' },
  { label: 'SPO Analytics', value: 'spo', icon: 'i-lucide-shopping-bag' },
  { label: 'SDP Analytics', value: 'sdp', icon: 'i-lucide-calendar' },
  { label: 'SDO Analytics', value: 'sdo', icon: 'i-lucide-truck' }
]

async function fetchData() {
  const params = {
    start_date: filters.value.start_date,
    end_date: filters.value.end_date
  }

  if (activeTab.value === 'forecast') {
    await salesAnalyticsStore.fetchForecastAnalytics(params)
  } else if (activeTab.value === 'spr') {
    await salesAnalyticsStore.fetchSprAnalytics(params)
  } else if (activeTab.value === 'spo') {
    await salesAnalyticsStore.fetchSpoAnalytics(params)
  } else if (activeTab.value === 'sdp') {
    // Fetched inside SdpTab.vue
  } else if (activeTab.value === 'sdo') {
    await Promise.all([
      salesAnalyticsStore.fetchSummary(params),
      salesAnalyticsStore.fetchSlaMetrics(params),
      salesAnalyticsStore.fetchForecastVsSpo(params),
      salesAnalyticsStore.fetchTopCustomers(params)
    ])
  }
}

async function handleDownloadExcel() {
  await salesAnalyticsStore.downloadExcel({
    start_date: filters.value.start_date,
    end_date: filters.value.end_date
  })
}

// Watch active tab to trigger fetch
watch(activeTab, () => {
  fetchData()
})

onMounted(() => {
  // Default to current month if no date set
  if (!filters.value.start_date) {
    filters.value.start_date = dayjs().startOf('month').format('YYYY-MM-DD')
    filters.value.end_date = dayjs().endOf('month').format('YYYY-MM-DD')
  }
  fetchData()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-black">
          Sales Analytics
        </h1>
        <p class="text-sm text-muted">
          Centralized dashboard for sales metrics and shipment reporting.
        </p>
      </div>

      <UButton
        v-slot:default
        v-if="activeTab === 'sdo' || activeTab === 'sdp'"
        color="primary"
        size="lg"
        icon="i-lucide-download"
        :loading="loading"
        @click="handleDownloadExcel"
      >
        Export Excel Report
      </UButton>
    </div>

    <!-- Global Date Filter Card -->
    <UCard>
      <div class="flex flex-col md:flex-row md:items-center gap-3">
        <div class="w-full md:w-72">
          <label class="text-xs text-muted block mb-1">Date Range</label>
          <HomeDateRangePicker v-model="dateRange as any" clear />
        </div>
      </div>
    </UCard>

    <!-- Navigation Tabs Card -->
    <UCard class="p-0">
      <UTabs v-model="activeTab" :items="tabItems" class="w-full" />
    </UCard>

    <!-- Error Alert -->
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="An error occurred"
      :description="error"
      icon="i-lucide-alert-circle"
    />

    <!-- Dynamic Content Area -->
    <div class="mt-6">
      <!-- 1. Forecast Analytics Tab -->
      <div v-if="activeTab === 'forecast'">
        <ForecastTab
          :start-date="filters.start_date || ''"
          :end-date="filters.end_date || ''"
        />
      </div>

      <!-- 2. SPR Analytics Tab -->
      <div v-else-if="activeTab === 'spr'">
        <SprTab
          :start-date="filters.start_date || ''"
          :end-date="filters.end_date || ''"
        />
      </div>

      <!-- 3. SPO Analytics Tab -->
      <div v-else-if="activeTab === 'spo'">
        <SpoTab
          :start-date="filters.start_date || ''"
          :end-date="filters.end_date || ''"
        />
      </div>

      <!-- 4. SDP Analytics Tab -->
      <div v-else-if="activeTab === 'sdp'">
        <SdpTab
          :start-date="filters.start_date || ''"
          :end-date="filters.end_date || ''"
        />
      </div>

      <!-- 5. SDO Analytics Tab -->
      <div v-else-if="activeTab === 'sdo'" class="space-y-6">
        <!-- KPI Metrics Grid (SPO Summary, SDO Delivery Status, SLA Performance) -->
        <div v-if="loading && !summary" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UCard v-for="i in 3" :key="i">
            <div class="space-y-3">
              <USkeleton class="h-4 w-1/2" />
              <USkeleton class="h-8 w-3/4" />
              <USkeleton class="h-4 w-full" />
            </div>
          </UCard>
        </div>
        <div v-else-if="summary" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- 1. SPO Summary -->
          <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted">Sales Purchase Orders</span>
                <UIcon name="i-lucide-shopping-cart" class="w-5 h-5 text-primary" />
              </div>
              <div>
                <p class="text-3xl font-bold text-black">
                  {{ summary.kpis.total_spos }}
                </p>
                <p class="text-xs text-muted mt-1">
                  Dokumen SPO terbit
                </p>
              </div>
              <div class="border-t border-default pt-3 space-y-2">
                <div class="flex justify-between text-xs">
                  <span class="text-muted">Ordered Items:</span>
                  <span class="font-semibold text-black">{{ summary.kpis.total_ordered_qty }} pcs</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-muted">Shipped Items:</span>
                  <span class="font-semibold text-black">{{ summary.kpis.total_sent_qty }} pcs</span>
                </div>
                <UProgress
                  :model-value="summary.kpis.total_ordered_qty > 0 ? (summary.kpis.total_sent_qty / summary.kpis.total_ordered_qty) * 100 : 0"
                  class="mt-2"
                />
              </div>
            </div>
          </UCard>

          <!-- 2. SDO Delivery Status counts -->
          <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted">Delivery Orders Status</span>
                <UIcon name="i-lucide-truck" class="w-5 h-5 text-warning" />
              </div>
              <div class="grid grid-cols-2 gap-2 border-t border-default pt-3">
                <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
                  <span class="text-[10px] text-muted uppercase">Delivered</span>
                  <span class="text-sm font-bold text-success">{{ summary.kpis.sdo_status_counts.Delivered || 0 }}</span>
                </div>
                <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
                  <span class="text-[10px] text-muted uppercase">In Transit</span>
                  <span class="text-sm font-bold text-primary">{{ summary.kpis.sdo_status_counts['In Transit'] || 0 }}</span>
                </div>
                <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
                  <span class="text-[10px] text-muted uppercase">Loading</span>
                  <span class="text-sm font-bold text-warning">{{ summary.kpis.sdo_status_counts.Loading || 0 }}</span>
                </div>
                <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
                  <span class="text-[10px] text-muted uppercase">Created</span>
                  <span class="text-sm font-bold text-muted">{{ summary.kpis.sdo_status_counts.Created || 0 }}</span>
                </div>
              </div>
            </div>
          </UCard>

          <!-- 3. SLA Performance -->
          <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted">SLA Performance</span>
                <UIcon name="i-lucide-timer" class="w-5 h-5 text-success" />
              </div>
              <div>
                <p class="text-3xl font-bold text-black">
                  {{ slaMetrics ? (slaMetrics.on_time_rate * 100).toFixed(1) : '—' }}%
                </p>
                <p class="text-xs text-muted mt-1">
                  On Time Rate (24h SLA)
                </p>
              </div>
              <div class="border-t border-default pt-3 space-y-2">
                <div class="flex justify-between text-xs">
                  <span class="text-muted">On Time:</span>
                  <span class="font-semibold text-success">{{ slaMetrics?.on_time ?? '—' }}</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-muted">Delayed:</span>
                  <span class="font-semibold text-error">{{ slaMetrics?.delayed ?? '—' }}</span>
                </div>
                <UProgress
                  :model-value="slaMetrics ? slaMetrics.on_time_rate * 100 : 0"
                  color="success"
                  class="mt-2"
                />
              </div>
            </div>
          </UCard>
        </div>

        <!-- Charts Grid (Forecast vs SPO & Top Customers) -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ForecastVsSpoChart
            v-slot:default
            v-if="forecastVsSpo.length"
            :forecast-vs-spo="forecastVsSpo"
            :loading="loading"
          />
          <TopCustomersChart
            v-slot:default
            v-if="topCustomers.length"
            :top-customers="topCustomers"
            :loading="loading"
          />
        </div>
      </div>
    </div>
  </div>
</template>
