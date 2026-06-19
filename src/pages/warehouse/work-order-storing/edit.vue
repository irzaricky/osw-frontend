<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'

import { useWarehouseAreaStore } from '../../../stores/master-data/warehouse-area.store'
import { usePartStore } from '../../../stores/master-data/part.store'
import { useWorkOrderStoringStore } from '../../../stores/warehouse/work-order-storing.store'
import { useMaterialReceivingStore } from '../../../stores/warehouse/material-receiving.store'
import { useAppToast } from '../../../composables/useAppToast'

import WorkOrderStoringForm from './components/WorkOrderStoringForm.vue'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'

// init
const router = useRouter()
const route = useRoute()
const workOrderStore = useWorkOrderStoringStore()
const warehouseAreaStore = useWarehouseAreaStore()
const partStore = usePartStore()
const materialReceivingStore = useMaterialReceivingStore()

const { workOrderTypes, bufferStations, productionWOs, loading } = storeToRefs(workOrderStore)
const { dropdown } = storeToRefs(warehouseAreaStore)
const areas = computed(() => dropdown.value)
const parts = computed(() => partStore.dropdown)
const refDocs = computed(() => materialReceivingStore.dropdown)
const isTypesLoaded = ref(false)
const { toastSuccess, toastError } = useAppToast()

// Get work order ID from route
const woId = computed(() => route.params.id as string)

// Fetch work order data for edit
const workOrderData = ref<any>(null)
const isLoadingData = ref(true)

async function fetchWorkOrderData() {
  try {
    isLoadingData.value = true
    const data = await workOrderStore.fetchWorkOrder(woId.value)
    workOrderData.value = data
    
    // After fetching work order, fetch related data
    if (data?.type?.id) {
      const isTakeOut = data.wo_category === 'Take Out'
      const isDeliveryOrder = !!data.ref_doc_id

      const isEditable = data.wo_status_id === 1 || data.status?.id === 1

      if (!isEditable) {
        await partStore.fetchDropdown()
      } else {
        // Part Dropdown
        // DELIVERY ORDER
        if (isDeliveryOrder) {
          await partStore.fetchDropdown({
            ref_doc_id: data.ref_doc_id
          })
        } else {
          // MANUAL / NORMAL
          await partStore.fetchDropdown({
            part_type_code: mapTypeToPartCode(
              data.type.id
            ),
            ...(isTakeOut && {
              wo_category: 'take_out',
              area_id: data.area?.id
            })
          })
        }
      }

      // Area Dropdown
      await warehouseAreaStore.fetchDropdown({
        category_id: data.type.id,

        ...(isTakeOut && {
          wo_category: 'take_out'
        })
      })
    }
  } catch (err) {
    toastError('Failed to load work order data')
    console.error('Error fetching work order:', err)
  } finally {
    isLoadingData.value = false
  }
}

function mapTypeToPartCode(typeId: number) {
  const map: Record<number, string> = {
    1: 'RAW',
    2: 'WIP',
    3: 'PRODUCT'
  }
  return map[typeId]
}

// breadcrumb
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Warehouse' },
  { label: 'Work Order Storing', to: '/warehouse/work-order-storing' },
  { label: 'Detail & Edit Work Order' }
]

// save
async function handleSave(data: any) {
  try {
    const res = await workOrderStore.updateWorkOrder(woId.value, data)

    toastSuccess(res.message || 'Work Order updated successfully')

    router.push('/warehouse/work-order-storing')
  } catch (err) {
    toastError(err)
  }
}

// fetch dropdown
onMounted(async () => {
  await workOrderStore.fetchWorkOrderTypesDropdown()
  await workOrderStore.fetchBufferStationDropdown()
  await workOrderStore.fetchWoProductionDropdown()
  await materialReceivingStore.fetchDropdown()
  isTypesLoaded.value = true
  warehouseAreaStore.fetchDropdown()
  partStore.fetchDropdown()
  
  await fetchWorkOrderData()
})
</script>

<template>
  <div v-if="isTypesLoaded && workOrderTypes.length && !isLoadingData">
    <div class="p-6 space-y-6">
      <Breadcrumbs :items="breadcrumbItems" />
      
      <div class="flex items-center gap-4">
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          @click="router.back()"
        />

        <div>
          <h1 class="text-2xl font-bold">
            Detail & Edit Work Order
          </h1>
          <p class="text-sm text-muted">
            Only work orders with Draft status can be edited.
          </p>
        </div>
      </div>

      <WorkOrderStoringForm
        mode="edit"
        :work-order="workOrderData"
        :types="workOrderTypes"
        :areas="areas"
        :parts="parts"
        :ref-docs="refDocs"
        :buffer-stations="bufferStations"
        :production-wos="productionWOs"
        :loading="loading"
        @save="handleSave"
      />
    </div>
  </div>
  <div v-else class="p-6 flex items-center justify-center">
    <UProgress indicator />
  </div>
</template>