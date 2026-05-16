<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import MaterialReceivingForm from './components/MaterialReceivingForm.vue'

import { useMaterialReceivingStore } from '../../../stores/warehouse/material-receiving.store'
import { useAppToast } from '../../../composables/useAppToast'

// Store
const router = useRouter()
const route = useRoute()
const materialReceivingStore = useMaterialReceivingStore()
const { loading } = storeToRefs(materialReceivingStore)
const materialReceiving = ref<any>(null)

const confirmDialog = reactive({
  open: false,
  title: '',
  description: '',
  action: null as (() => Promise<void>) | null
})

const { toastSuccess, toastError } = useAppToast()

const mdoId = computed(() => route.params.id as string)

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Warehouse' },
  { label: 'Material Receiving', to: '/warehouse/material-receiving' },
  { label: 'Set Arrived & Process' }
]

// Fetch detail
async function fetchDetail() {
  const response = await materialReceivingStore.fetchMaterialReceiving(mdoId.value)
  materialReceiving.value = response
}

// Mark as arrived
async function submitArrived(remarks: string) {
  try {
    const res = await materialReceivingStore.setArrived(mdoId.value, { remarks })
    toastSuccess(res.message || 'Material successfully marked as arrived.')
    router.push('/warehouse/material-receiving')
  } catch (err) {
    toastError(err)
  }
}

async function handleArrived(remarks: string) {
  const today = new Date()
  const targetDate = new Date(materialReceiving.value.target_date)
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)

  if (today < targetDate) {
    confirmDialog.title = 'Early Arrival Confirmation'
    confirmDialog.description = 'This material delivery arrived earlier than the target date. Do you want to continue marking it as arrived?'
    confirmDialog.action = async () => {
      await submitArrived(remarks)
      confirmDialog.open = false
    }
    confirmDialog.open = true
    return
  }

  await submitArrived(remarks)
}

// Print label
async function handlePrintLabel(item: any) {
  try {
    await materialReceivingStore.printLabel(
      item.id,
      item.part?.part_number || ''
    )
  } catch (err) {
    toastError(err)
  }
}

// Lifecycle
onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div v-if="!loading && materialReceiving">
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
            Set Arrived & Process
          </h1>

          <p class="text-sm text-muted">
            Confirm incoming material delivery and process receiving items.
          </p>
        </div>
      </div>

      <MaterialReceivingForm
        :material-receiving="materialReceiving"
        :loading="loading"
        @arrived="handleArrived"
        @print-label="handlePrintLabel"
      />
    </div>
  </div>
  <div v-else class="p-6 flex items-center justify-center">
    <UProgress indicator />
  </div>

  <ConfirmDialog
    v-model:open="confirmDialog.open"
    :title="confirmDialog.title"
    :description="confirmDialog.description"
    confirm-label="Continue"
    :loading="loading"
    @confirm="confirmDialog.action?.()"
  />
</template>