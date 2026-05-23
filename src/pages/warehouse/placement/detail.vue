<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import { usePlacementStore } from '../../../stores/warehouse/placement.store'
import { useAppToast } from '../../../composables/useAppToast'

import PlacementProgress from './components/PlacementProgress.vue'
import PlacementScanPart from './components/PlacementScanPart.vue'
import PlacementScanBin from './components/PlacementScanBin.vue'
import PlacementItemCard from './components/PlacementItemCard.vue'
import QRCodeScannerModal from './components/QRCodeScannerModal.vue'

const route = useRoute()
const placementStore = usePlacementStore()
const { placementDetail, scannedLabel, availableBins, loading } = storeToRefs(placementStore)
const { toastSuccess, toastError } = useAppToast()

const woId = computed(() => route.params.id as string)

const labelNumber = ref('')
const binCode = ref('')
const qtyPerKanban = ref(1)


const breadcrumbItems = computed(() => [
    { label: 'Home', to: '/' },
    { label: 'Warehouse' },
    { label: 'Placement', to: '/warehouse/placement' },
    { label: placementDetail.value?.wo_number || 'Detail' }
])

const statusColor = computed(() => {
    const status = placementDetail.value?.status?.name
    if (status === 'Completed') return 'success'
    if (status === 'In Progress') return 'warning'
    return 'primary'
})

const partScannerOpen = ref(false)
const binScannerOpen = ref(false)

function openPartScanner() {
    partScannerOpen.value = true
}

function openBinScanner() {
    binScannerOpen.value = true
}

async function onPartQrScanned(value: string) {
    labelNumber.value = value
    await handleScanLabel()
}

async function onBinQrScanned(value: string) {
    try {
        const parsed = JSON.parse(value)
        binCode.value = parsed.bin_code || parsed.binCode || value
    } catch {
        binCode.value = value
    }


    if (scannedLabel.value && binCode.value) {
        await handlePlaceBin()
    }
}
async function fetchDetail() {
    await placementStore.fetchPlacementDetail(woId.value)
}

async function handleScanLabel() {
    try {
        const res = await placementStore.validateLabel(woId.value, {
            label_number: labelNumber.value
        })

        toastSuccess(res.message || 'Label valid')

        await placementStore.fetchAvailableBins(woId.value, {
            part_number: res.data?.part?.part_number
        })
    } catch (err: any) {
        toastError(err)
    }
}

async function handlePlaceBin() {
    try {
        const res = await placementStore.placeBin(woId.value, {
            label_number: labelNumber.value,
            bin_code: binCode.value,
            qty_per_kanban: qtyPerKanban.value
        })

        toastSuccess(res.message || 'Label successfully placed')

        labelNumber.value = ''
        binCode.value = ''
        qtyPerKanban.value = 1

        placementStore.resetScanState()

        await fetchDetail()
    } catch (err: any) {
        toastError(err)
    }
}



function selectBin(code: string) {
    binCode.value = code
}

onMounted(() => {
    placementStore.resetScanState()
    fetchDetail()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">
          Stock In Placement Detail
        </h1>
        <p class="text-sm text-muted">
          Scan part label, validate item, then scan storage bin.
        </p>
      </div>

      <UBadge v-if="placementDetail?.status" variant="soft" :color="statusColor">
        {{ placementDetail.status.name }}
      </UBadge>
    </div>

    <div v-if="placementDetail" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <UCard class="lg:col-span-2">
        <template #header>
          <div class="font-semibold">
            Work Order Information
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-muted">
              Work Order Number
            </p>
            <p class="font-medium">
              {{ placementDetail.wo_number }}
            </p>
          </div>

          <div>
            <p class="text-muted">
              Work Order Date
            </p>
            <p class="font-medium">
              {{ placementDetail.wo_date ? new Date(placementDetail.wo_date).toLocaleDateString() : '-' }}
            </p>
          </div>

          <div>
            <p class="text-muted">
              Type
            </p>
            <p class="font-medium">
              {{ placementDetail.type?.name || '-' }}
            </p>
          </div>

          <div>
            <p class="text-muted">
              Warehouse Area
            </p>
            <p class="font-medium">
              {{ placementDetail.area?.name || '-' }}
            </p>
          </div>

          <div class="md:col-span-2">
            <p class="text-muted">
              Description
            </p>
            <p class="font-medium">
              {{ placementDetail.wo_description || '-' }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="font-semibold">
            Progress
          </div>
        </template>

        <PlacementProgress
          :total="placementDetail.total_label"
          :scanned="placementDetail.total_scanned"
          :progress="placementDetail.progress"
          :total-pcs="placementDetail.total_pcs"
          :scanned-pcs="placementDetail.scanned_pcs"
        />

        <div class="grid grid-cols-3 gap-2 text-center text-sm mt-4">
          <div class="rounded-lg border border-default p-2">
            <p class="text-muted">
              Total
            </p>
            <p class="font-bold">
              {{ placementDetail.total_label }}
            </p>
          </div>
          <div class="rounded-lg border border-default p-2">
            <p class="text-muted">
              Scanned
            </p>
            <p class="font-bold">
              {{ placementDetail.total_scanned }}
            </p>
          </div>
          <div class="rounded-lg border border-default p-2">
            <p class="text-muted">
              Remaining
            </p>
            <p class="font-bold">
              {{ placementDetail.remaining }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <PlacementScanPart
        v-model="labelNumber"
        :scanned-label="scannedLabel"
        :loading="loading"
        @scan="handleScanLabel"
        @scan-qr="openPartScanner"
      />

      <PlacementScanBin
        v-model:bin-code="binCode"
        v-model:qty-per-kanban="qtyPerKanban"
        :scanned-label="scannedLabel"
        :available-bins="availableBins"
        :loading="loading"
        @place="handlePlaceBin"
        @select-bin="selectBin"
        @scan-qr="openBinScanner"
      />
    </div>

    <UCard v-if="placementDetail">
      <template #header>
        <div class="font-semibold">
          Part Items
        </div>
      </template>

      <div class="space-y-4">
        <PlacementItemCard v-for="item in placementDetail.items" :key="item.wo_item_id" :item="item" />
      </div>
    </UCard>

    <UCard v-else>
      <div class="py-10 text-center text-muted">
        Loading placement detail...
      </div>
    </UCard>
  </div>

  <QRCodeScannerModal v-model:open="partScannerOpen" title="Scan Part Label QR" @scanned="onPartQrScanned" />

  <QRCodeScannerModal v-model:open="binScannerOpen" title="Scan Storage Bin QR" @scanned="onBinQrScanned" />
</template>