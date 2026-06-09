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
import SdoTab from './components/SdoTab.vue'

import { useSalesAnalyticsStore } from '../../../stores/sales/analytics.store'

const salesAnalyticsStore = useSalesAnalyticsStore()
const { loading, error, filters } = storeToRefs(salesAnalyticsStore)

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
    await salesAnalyticsStore.fetchSummary(params)
  } else if (activeTab.value === 'sdo') {
    await salesAnalyticsStore.fetchSdoAnalytics(params)
  }
}

async function handleDownloadExcel() {
  await salesAnalyticsStore.downloadExcel({
    start_date: filters.value.start_date,
    end_date: filters.value.end_date
  }, activeTab.value)
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
        <h1 class="text-2xl font-bold">
          Sales Analytics
        </h1>
        <p class="text-sm text-muted">
          Centralized dashboard for sales metrics and shipment reporting.
        </p>
      </div>

      <UButton
        v-slot:default
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
      <div v-else-if="activeTab === 'sdo'">
        <SdoTab
          :start-date="filters.start_date || ''"
          :end-date="filters.end_date || ''"
        />
      </div>
    </div>
  </div>
</template>
