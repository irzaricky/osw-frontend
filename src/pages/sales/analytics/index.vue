<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import HomeDateRangePicker from '../../../components/home/HomeDateRangePicker.vue'
import { useSalesAnalyticsStore } from '../../../stores/sales/analytics.store'

const salesAnalyticsStore = useSalesAnalyticsStore()
const { summary, loading, error, filters } = storeToRefs(salesAnalyticsStore)

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

async function fetchData() {
  await salesAnalyticsStore.fetchSummary({
    start_date: filters.value.start_date,
    end_date: filters.value.end_date
  })
}

async function handleDownloadExcel() {
  await salesAnalyticsStore.downloadExcel({
    start_date: filters.value.start_date,
    end_date: filters.value.end_date
  })
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Sales Analytics</h1>
        <p class="text-sm text-muted">Dasbor analitik penjualan dan pelaporan pengiriman terpusat.</p>
      </div>

      <UButton
        color="primary"
        size="lg"
        icon="i-lucide-download"
        :loading="loading"
        @click="handleDownloadExcel"
      >
        Unduh Laporan Excel
      </UButton>
    </div>

    <!-- Date Filter Bar -->
    <UCard>
      <div class="flex flex-col md:flex-row md:items-center gap-3">
        <div class="w-full md:w-72">
          <label class="text-xs text-muted block mb-1">Rentang Tanggal</label>
          <HomeDateRangePicker v-model="dateRange as any" clear />
        </div>
      </div>
    </UCard>

    <!-- Error Alert -->
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Terjadi kesalahan"
      :description="error"
      icon="i-lucide-alert-circle"
    />

    <!-- KPI Metrics Grid -->
    <div v-if="loading && !summary" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard v-for="i in 4" :key="i">
        <div class="space-y-3">
          <USkeleton class="h-4 w-1/2" />
          <USkeleton class="h-8 w-3/4" />
          <USkeleton class="h-4 w-full" />
        </div>
      </UCard>
    </div>

    <div v-else-if="summary" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. SPO Summary -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Sales Purchase Orders</span>
            <UIcon name="i-lucide-shopping-cart" class="w-5 h-5 text-primary" />
          </div>
          <div>
            <p class="text-3xl font-bold">{{ summary.kpis.total_spos }}</p>
            <p class="text-xs text-muted mt-1">Dokumen SPO terbit</p>
          </div>
          <div class="border-t border-default pt-3 space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-muted">Item Dipesan:</span>
              <span class="font-semibold">{{ summary.kpis.total_ordered_qty }} pcs</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-muted">Item Terkirim:</span>
              <span class="font-semibold">{{ summary.kpis.total_sent_qty }} pcs</span>
            </div>
            <UProgress
              :model-value="summary.kpis.total_ordered_qty > 0 ? (summary.kpis.total_sent_qty / summary.kpis.total_ordered_qty) * 100 : 0"
              class="mt-2"
            />
          </div>
        </div>
      </UCard>

      <!-- 2. SDP Active Plans -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Active Shipment Plans</span>
            <UIcon name="i-lucide-calendar" class="w-5 h-5 text-success" />
          </div>
          <div>
            <p class="text-3xl font-bold">{{ summary.kpis.active_plans_count }}</p>
            <p class="text-xs text-muted mt-1">Schedules Pending / Draft</p>
          </div>
          <div class="border-t border-default pt-3 space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-muted">Total Rencana:</span>
              <span class="font-semibold">{{ summary.kpis.total_plans_count }} SDP</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- 3. SDO Delivery Status counts -->
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
              <span class="text-[10px] text-muted uppercase">Scheduled</span>
              <span class="text-sm font-bold text-warning">{{ summary.kpis.sdo_status_counts.Scheduled || 0 }}</span>
            </div>
            <div class="bg-default/50 p-2 rounded flex flex-col justify-center items-center">
              <span class="text-[10px] text-muted uppercase">Draft</span>
              <span class="text-sm font-bold text-muted">{{ summary.kpis.sdo_status_counts.Draft || 0 }}</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- 4. Dock occupancy -->
      <UCard class="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Dock Occupancy</span>
            <UIcon name="i-lucide-anchor" class="w-5 h-5 text-error" />
          </div>
          <div>
            <p class="text-3xl font-bold">
              {{ summary.dock_utilization.reduce((acc, curr) => acc + curr.total_hours, 0).toFixed(1) }} jam
            </p>
            <p class="text-xs text-muted mt-1">Total waktu dermaga terpakai</p>
          </div>
          <div class="border-t border-default pt-3 space-y-2 max-h-[80px] overflow-y-auto">
            <div v-for="dock in summary.dock_utilization" :key="dock.id" class="flex justify-between text-xs">
              <span class="text-muted">{{ dock.name }}:</span>
              <span class="font-semibold">{{ dock.total_hours.toFixed(1) }} jam ({{ dock.plan_count }} plan)</span>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Excel Export Premium Section -->
    <UCard v-if="summary" class="bg-gradient-to-r from-primary/10 via-background to-success/10 border-primary/20">
      <div class="flex flex-col md:flex-row items-center justify-between gap-6 p-4">
        <div class="space-y-2">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <UIcon name="i-lucide-file-spreadsheet" class="w-6 h-6 text-success animate-pulse" />
            Ekspor Laporan Pengiriman Sales Delivery Order
          </h3>
          <p class="text-sm text-muted">
            Unduh seluruh log transisi, pengemudi, armada, status, serta kuantitas item terkirim vs diterima dalam format spreadsheet Excel (.xlsx) dengan visualisasi premium.
          </p>
        </div>
        <UButton
          color="success"
          size="xl"
          icon="i-lucide-download"
          :loading="loading"
          @click="handleDownloadExcel"
          class="shadow-lg hover:shadow-success/20 transition-all duration-300 transform hover:scale-105"
        >
          Download Laporan (.xlsx)
        </UButton>
      </div>
    </UCard>
  </div>
</template>
