<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useMaterialAnalyticsStore } from '../../../stores/material/analytics.store'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import MrpAnalyticsTab from './components/MrpTab.vue'
import MprAnalyticsTab from './components/MprTab.vue'
import MpoAnalyticsTab from './components/MpoTab.vue'
import MdoAnalyticsTab from './components/MdoTab.vue'

const store = useMaterialAnalyticsStore()

// ─── Breadcrumbs ───────────────────────────────────────────────────────────────
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Material' },
  { label: 'Analytics' }
]

// ─── Tabs ───────────────────────────────────────────────────────────────────────
const tabs = [
  { label: 'MRP', value: 'mrp', icon: 'i-lucide-clipboard-list' },
  { label: 'MPR', value: 'mpr', icon: 'i-lucide-file-text' },
  { label: 'MPO', value: 'mpo', icon: 'i-lucide-shopping-cart' },
  { label: 'MDO', value: 'mdo', icon: 'i-lucide-truck' }
]
const activeTab = ref<'mrp' | 'mpr' | 'mpo' | 'mdo'>('mrp')

// ─── Date Range Filter ──────────────────────────────────────────────────────────
// NOTE: Pakai <input type="date"> polos di sini, BUKAN komponen
// HomeDateRangePicker yang dipakai di Sales Analytics — karena saya tidak
// punya akses ke source komponen itu untuk memastikan prop API-nya persis.
// Kalau mau visualnya benar-benar identik dengan Sales Analytics, ganti
// dua <input> di bawah ini dengan <HomeDateRangePicker> dan sesuaikan
// v-model-nya ke startDate/endDate.
function getDefaultRange() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const toIso = (d: Date) => d.toISOString().slice(0, 10)
  return { start: toIso(firstDay), end: toIso(now) }
}

const defaultRange = getDefaultRange()
const startDate = ref(defaultRange.start)
const endDate = ref(defaultRange.end)

// ─── Lazy-load per tab: hanya fetch saat tab pertama kali dibuka,
// atau saat filter tanggal berubah (loadedTabs di-reset) ───────────────────────
const loadedTabs = reactive<Record<string, boolean>>({ mrp: false, mpr: false, mpo: false, mdo: false })

function fetchTab(tab: string) {
  const params = { start_date: startDate.value, end_date: endDate.value }
  if (tab === 'mrp') store.fetchMrpAnalytics(params)
  else if (tab === 'mpr') store.fetchMprAnalytics(params)
  else if (tab === 'mpo') store.fetchMpoAnalytics(params)
  else if (tab === 'mdo') store.fetchMdoAnalytics(params)
  loadedTabs[tab] = true
}

watch(activeTab, (tab) => {
  if (!loadedTabs[tab]) fetchTab(tab)
})

const debouncedRangeChange = useDebounceFn(() => {
  loadedTabs.mrp = false
  loadedTabs.mpr = false
  loadedTabs.mpo = false
  loadedTabs.mdo = false
  fetchTab(activeTab.value)
}, 400)

watch([startDate, endDate], debouncedRangeChange)

onMounted(() => {
  fetchTab(activeTab.value)
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="px-4 sm:px-6 py-4 border-b border-default shrink-0 space-y-4">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold">
            Material Analytics
          </h1>
          <p class="text-sm text-muted">
            Ringkasan performa siklus material: MRP, MPR, MPO, dan MDO
          </p>
        </div>

        <!-- Date Range Filter -->
        <div class="flex items-center gap-2">
          <UInput v-model="startDate" type="date" size="sm" />
          <span class="text-muted text-xs">s/d</span>
          <UInput v-model="endDate" type="date" size="sm" />
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            size="sm"
            :loading="store.loading"
            @click="fetchTab(activeTab)"
          />
        </div>
      </div>

      <UTabs v-model="activeTab" :items="tabs" />
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <MrpAnalyticsTab v-if="activeTab === 'mrp'" :start-date="startDate" :end-date="endDate" />
      <MprAnalyticsTab v-else-if="activeTab === 'mpr'" :start-date="startDate" :end-date="endDate" />
      <MpoAnalyticsTab v-else-if="activeTab === 'mpo'" :start-date="startDate" :end-date="endDate" />
      <MdoAnalyticsTab v-else-if="activeTab === 'mdo'" :start-date="startDate" :end-date="endDate" />
    </div>
  </div>
</template>