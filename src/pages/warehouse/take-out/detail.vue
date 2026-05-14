<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import QRCodeScannerModal from '../placement/components/QRCodeScannerModal.vue'
import { useAppToast } from '../../../composables/useAppToast'
import { useTakeOutStore } from '../../../stores/warehouse/take-out.store'

import TakeOutProgress from './components/TakeOutProgress.vue'
import TakeOutScanLabel from './components/TakeOutScanLabel.vue'
import TakeOutRecommendationCard from './components/TakeOutRecommendationCard.vue'
import TakeOutItemCard from './components/TakeOutItemCard.vue'

const route = useRoute()
const takeOutStore = useTakeOutStore()
const { takeOutDetail, recommendations, loading } = storeToRefs(takeOutStore)
const { toastSuccess, toastError } = useAppToast()

const woId = computed(() => route.params.id as string)

const labelNumber = ref('')
const fifoOverride = ref(false)
const scannerOpen = ref(false)

const fifoWarning = ref<{
  scannedLabel?: string
  recommendedLabel?: string
  message?: string
} | null>(null)

const isCompleted = computed(() => {
  const total = Number(takeOutDetail.value?.total_label || 0)
  const scanned = Number(takeOutDetail.value?.total_scanned_out || 0)
  const remaining = Number(takeOutDetail.value?.remaining ?? total - scanned)
  const status = takeOutDetail.value?.status?.name

  return status === 'Completed' || (total > 0 && scanned >= total) || remaining === 0
})

const breadcrumbItems = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Warehouse' },
  { label: 'Take Out', to: '/warehouse/take-out' },
  { label: takeOutDetail.value?.wo_number || 'Detail' }
])

const statusColor = computed(() => {
  const status = takeOutDetail.value?.status?.name

  if (status === 'Completed') return 'success'
  if (status === 'In Progress') return 'warning'

  return 'primary'
})

async function fetchData() {
  await Promise.all([
    takeOutStore.fetchTakeOutDetail(woId.value),
    takeOutStore.fetchRecommendations(woId.value)
  ])
}

async function handleScanLabel() {
  try {
    if (!labelNumber.value) return

    fifoWarning.value = null

    const res = await takeOutStore.scanLabelOut(woId.value, {
      label_number: labelNumber.value,
      fifo_override: fifoOverride.value
    })

    toastSuccess(res.message || 'Label successfully taken out')

    fifoOverride.value = false
    labelNumber.value = ''

    await fetchData()
  } catch (err: any) {
    const response = err.response?.data

    if (response?.message?.includes('FIFO violation')) {
      fifoWarning.value = {
        scannedLabel: response.data?.scanned_label,
        recommendedLabel: response.data?.recommended_label,
        message: response.message
      }

      toastError(`FIFO violation. Use label: ${response.data?.recommended_label || '-'}`)
      return
    }

    toastError(err)
  }
}

function openScanner() {
  scannerOpen.value = true
}

async function onQrScanned(value: string) {
  labelNumber.value = value
  await handleScanLabel()
}

function selectRecommendedLabel(payload: string | { labelNumber: string, fifoOverride?: boolean }) {
  if (typeof payload === 'string') {
    labelNumber.value = payload
    fifoOverride.value = false
  } else {
    labelNumber.value = payload.labelNumber
    fifoOverride.value = !!payload.fifoOverride
  }

  fifoWarning.value = null
}

onMounted(() => {
  takeOutStore.resetTakeOutState()
  fetchData()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">
          Stock Out Take Out Detail
        </h1>
        <p class="text-sm text-muted">
          Use FIFO recommendation and scan stock label to take out.
        </p>
      </div>

      <UBadge
        v-if="takeOutDetail?.status"
        variant="soft"
        :color="statusColor"
      >
        {{ takeOutDetail.status.name }}
      </UBadge>
    </div>

    <div v-if="takeOutDetail" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <UCard class="lg:col-span-2">
        <template #header>
          <div class="font-semibold">
            Work Order Information
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-muted">Work Order Number</p>
            <p class="font-medium">{{ takeOutDetail.wo_number }}</p>
          </div>

          <div>
            <p class="text-muted">Work Order Date</p>
            <p class="font-medium">
              {{ takeOutDetail.wo_date ? new Date(takeOutDetail.wo_date).toLocaleDateString() : '-' }}
            </p>
          </div>

          <div>
            <p class="text-muted">Type</p>
            <p class="font-medium">{{ takeOutDetail.type?.name || '-' }}</p>
          </div>

          <div>
            <p class="text-muted">Warehouse Area</p>
            <p class="font-medium">{{ takeOutDetail.area?.name || '-' }}</p>
          </div>

          <div class="md:col-span-2">
            <p class="text-muted">Description</p>
            <p class="font-medium">{{ takeOutDetail.wo_description || '-' }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="font-semibold">
            Progress
          </div>
        </template>

        <TakeOutProgress
          :total="takeOutDetail.total_label"
          :scanned="takeOutDetail.total_scanned_out"
          :progress="takeOutDetail.progress"
          :total-pcs="takeOutDetail.total_pcs"
          :scanned-pcs="takeOutDetail.scanned_out_pcs"
        />

        <div class="grid grid-cols-3 gap-2 text-center text-sm mt-4">
          <div class="rounded-lg border border-default p-2">
            <p class="text-muted">Total</p>
            <p class="font-bold">{{ takeOutDetail.total_label }}</p>
          </div>

          <div class="rounded-lg border border-default p-2">
            <p class="text-muted">Taken Out</p>
            <p class="font-bold">{{ takeOutDetail.total_scanned_out }}</p>
          </div>

          <div class="rounded-lg border border-default p-2">
            <p class="text-muted">Remaining</p>
            <p class="font-bold">{{ takeOutDetail.remaining }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <UAlert
      v-if="isCompleted"
      color="success"
      variant="soft"
      icon="i-lucide-check-circle"
      title="Take Out Completed"
      description="All requested labels have been taken out."
    />

    <UAlert
      v-if="fifoWarning"
      color="warning"
      variant="soft"
      icon="i-lucide-alert-triangle"
      title="FIFO Violation"
    >
      <template #description>
        <div class="space-y-1">
          <p>{{ fifoWarning.message }}</p>
          <p>
            Scanned:
            <span class="font-semibold">{{ fifoWarning.scannedLabel || '-' }}</span>
          </p>
          <p>
            Recommended:
            <span class="font-semibold">{{ fifoWarning.recommendedLabel || '-' }}</span>
          </p>
        </div>
      </template>
    </UAlert>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TakeOutScanLabel
        v-model="labelNumber"
        :loading="loading"
        :disabled="isCompleted"
        @scan="handleScanLabel"
        @scan-qr="openScanner"
      />

      <div class="space-y-4">
        <TakeOutRecommendationCard
          v-for="recommendation in recommendations"
          :key="recommendation.wo_item_id"
          :recommendation="recommendation"
          :completed="isCompleted"
          @select-label="selectRecommendedLabel"
        />

        <UCard v-if="!recommendations.length">
          <div class="py-10 text-center text-muted">
            No FIFO recommendation available.
          </div>
        </UCard>
      </div>
    </div>

    <UCard v-if="takeOutDetail">
      <template #header>
        <div class="font-semibold">
          Part Items
        </div>
      </template>

      <div class="space-y-4">
        <TakeOutItemCard
          v-for="item in takeOutDetail.items"
          :key="item.wo_item_id"
          :item="item"
        />
      </div>
    </UCard>

    <QRCodeScannerModal
      v-model:open="scannerOpen"
      title="Scan Take Out Label QR"
      @scanned="onQrScanned"
    />
  </div>
</template>