<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs }         from 'pinia'
import { useWorkOrderStore }   from '../../../stores/production-plan/work-order.store'
import { useAppToast }         from '../../../composables/useAppToast'
import { WO_STATUS_COLOR, WO_STATUS_LABEL } from './composables/useWorkOrderColumns'
import type { StartWorkOrderPayload } from '../../../types/production-plan/work-order'

import Breadcrumbs     from '../../../components/Breadcrumbs.vue'
import WOInfoBar       from './components/WOInfoBar.vue'
import WOQualityMetrics from './components/WOQualityMetrics.vue'
import WOStationsList  from './components/WOStationsList.vue'
import WOStartModal    from './components/WOStartModal.vue'

const route  = useRoute()
const router = useRouter()
const store  = useWorkOrderStore()
const { currentWO, loading, saving, checkingStock, materialCheck } = storeToRefs(store)
const { toastSuccess, toastError } = useAppToast()

const woId = computed(() => Number(route.params.id))

const showStartModal = ref(false)

const breadcrumbItems = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Production Plan' },
  { label: 'Work Orders', to: { name: 'work-order-list' } },
  { label: currentWO.value?.wo_number ?? '...' },
])

const canStart = computed(() => currentWO.value?.status === 'Released')

// Navigate to station detail page
function openStation(stationId: number) {
  router.push({ name: 'work-order-station-detail', params: { id: woId.value, station_id: stationId } })
}

async function handleCheckMaterials() {
  try {
    await store.checkMaterials(woId.value)
  } catch (e) {
    toastError(e)
  }
}

async function handleStart(payload: StartWorkOrderPayload) {
  try {
    const res = await store.startWorkOrder(woId.value, payload)
    toastSuccess(res.message || 'Work Order started')
    showStartModal.value = false
    await store.fetchWorkOrder(woId.value)
  } catch (e) { toastError(e) }
}

onMounted(async () => {
  store.clearCurrentWO()
  await store.fetchWorkOrder(woId.value)
})

watch(
  () => route.params.id,
  async (newId) => {
    if (!newId) return
    store.clearCurrentWO()
    await store.fetchWorkOrder(Number(newId))
  },
)
</script>

<template>
  <UDashboardPanel id="work-order-detail">
    <template #header>
      <UDashboardNavbar title="Work Order Detail">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div v-if="loading && !currentWO" class="flex items-center justify-center py-24">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted" />
      </div>

      <!-- Not found -->
      <div v-else-if="!currentWO && !loading" class="flex flex-col items-center justify-center py-24 gap-4">
        <UIcon name="i-lucide-file-x-2" class="w-12 h-12 text-muted" />
        <p class="text-sm text-muted">Work Order not found</p>
        <UButton label="Back to List" color="neutral" variant="soft" @click="router.push({ name: 'work-order-list' })" />
      </div>

      <div v-else-if="currentWO" class="space-y-6">
        <Breadcrumbs :items="breadcrumbItems" />

        <!-- Header -->
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" @click="router.push({ name: 'work-order-list' })" />
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-2xl font-bold font-mono">{{ currentWO.wo_number }}</h1>
                <UBadge
                  :label="WO_STATUS_LABEL[currentWO.status]"
                  :color="WO_STATUS_COLOR[currentWO.status]"
                  variant="subtle"
                />
              </div>
              <p class="text-sm text-muted mt-0.5">
                {{ currentWO.part?.part_name }} · {{ currentWO.line?.name }}
              </p>
            </div>
          </div>

          <UButton
            v-if="canStart"
            label="Start WO"
            icon="i-lucide-play"
            color="primary"
            :loading="saving"
            @click="showStartModal = true"
          />
        </div>

        <!-- ✅ MAIN INFO BAR - Final Output Metrics -->
        <WOInfoBar 
          :wo="currentWO"
        />

        <!-- ✅ NEW: Quality Metrics Bar - Upstream defects + total loss -->
        <WOQualityMetrics 
          :wo="currentWO"
        />

        <!-- Station list — click to navigate into station detail -->
        <div>
          <h2 class="text-base font-semibold mb-3">Process Stations</h2>
          <WOStationsList
            :stations="currentWO.stations ?? []"
            :wo-status="currentWO.status"
            @select="openStation"
          />
        </div>

        <WOStartModal
          v-model:open="showStartModal"
          :wo="currentWO"
          :loading="saving"
          :checking-stock="checkingStock"
          :material-check="materialCheck"
          @check="handleCheckMaterials"
          @confirm="handleStart"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>