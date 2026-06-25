<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
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
const workOrderStore = useWorkOrderStoringStore()
const warehouseAreaStore = useWarehouseAreaStore()
const partStore = usePartStore()
const materialReceivingStore = useMaterialReceivingStore()

const { workOrderTypes, stations, productionWOs, loading } = storeToRefs(workOrderStore)
const { dropdown } = storeToRefs(warehouseAreaStore)
const areas = computed(() => dropdown.value)
const parts = computed(() => partStore.dropdown)
const refDocs = computed(() => materialReceivingStore.dropdown)
const isTypesLoaded = ref(false)
const { toastSuccess, toastError } = useAppToast()

// breadcrumb
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Warehouse' },
  { label: 'Work Order Storing', to: '/warehouse/work-order-storing' },
  { label: 'Create Work Order' }
]

// save
async function handleSave(data: any) {
  try {
    const res = await workOrderStore.createWorkOrder(data)

    toastSuccess(res.message || 'Work Order created successfully')

    router.push('/warehouse/work-order-storing')
  } catch (err) {
    toastError(err)
  }
}

// fetch dropdown
onMounted(async () => {
  await workOrderStore.fetchWorkOrderTypesDropdown()
  await workOrderStore.fetchStationDropdown()
  await workOrderStore.fetchWoProductionDropdown()
  await materialReceivingStore.fetchDropdown()
  isTypesLoaded.value = true
  warehouseAreaStore.fetchDropdown()
  partStore.fetchDropdown()
})
</script>

<template>
  <div v-if="isTypesLoaded && workOrderTypes.length">
    <div class="p-6 space-y-6">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="flex items-center gap-4">
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          @click="router.back()"
        />

        <h1 class="text-2xl font-bold">
          Create Work Order
        </h1>
      </div>

      <WorkOrderStoringForm
        mode="add"
        :work-order="{}"
        :types="workOrderTypes"
        :areas="areas"
        :parts="parts"
        :ref-docs="refDocs"
        :stations="stations"
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