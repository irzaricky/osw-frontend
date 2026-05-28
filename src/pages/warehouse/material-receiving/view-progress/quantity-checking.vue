<script setup lang="ts">
import { ref, computed, onMounted, resolveComponent, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import Breadcrumbs from '../../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../../components/ConfirmDialog.vue'
import QuantityIncompleteModal from '../components/QuantityIncompleteFormModal.vue'
import LabelScannerModal from '../components/LabelScannerModal.vue'

import { useMaterialReceivingStore } from '../../../../stores/warehouse/material-receiving.store'
import { useQuantityCheckingColumns } from '../composables/useQuantityCheckingColumns'
import { useAppToast } from '../../../../composables/useAppToast'
import type { QuantityCheckingDetail, QuantityCheckingLabel } from '../../../../types/warehouse/material-receiving'

// Store
const router = useRouter()
const route = useRoute()

const materialReceivingStore = useMaterialReceivingStore()
const { toastSuccess, toastError } = useAppToast()

const uiComponents = {
  UBadge: resolveComponent('UBadge'),
  UButton: resolveComponent('UButton'),
  UDropdownMenu: resolveComponent('UDropdownMenu')
}

// Loading State
const pageLoading = ref(false)
const scanLoading = ref(false)
const submitLoading = ref(false)
const incompleteLoading = ref(false)

// State
const detail = ref<QuantityCheckingDetail | null>(null)
const scanLabel = ref('')

const confirmDialog = reactive({
  open: false,
  title: '',
  description: '',
  action: null as (() => Promise<void>) | null
})

// Incomplete Modal
const incompleteModal = reactive({
  open: false,
  label: null as QuantityCheckingLabel | null
})

// Scanner Modal
const scannerModal = reactive({
  open: false
})

const mdoDetailId = computed(
  () => route.params.mdo_detail_id as string
)

const isSubmitted = computed(() => {
  return !!detail.value?.submitted_at
})

const hasRemainingQty = computed(() => {
  return (
    Number(detail.value?.part.remaining_qty || 0) > 0
  )
})

const progressPercentage = computed(() => {
  const total = Number(detail.value?.part.total_qty || 0)
  const checked = Number(detail.value?.part.checked_qty || 0)
  if (total <= 0) return 0
  return Math.round((checked / total) * 100)
})

const progressColor = computed(() => {
  if (progressPercentage.value >= 100) {
    return 'success'
  }

  if (progressPercentage.value >= 50) {
    return 'warning'
  }

  return 'error'
})

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Warehouse' },
  { label: 'Material Receiving', to: '/warehouse/material-receiving' },
  { label: 'View Progress', to: `/warehouse/material-receiving/view-progress/${route.params.id}` },
  { label: 'Quantity Checking' }
]

// Fetch Detail
async function fetchDetail() {
  try {
    pageLoading.value = true
    const response = await materialReceivingStore.fetchQuantityCheckingDetail(mdoDetailId.value)
    detail.value = response
  } catch (err) {
    toastError(err)
  } finally {
    pageLoading.value = false
  }
}

// Scan Label
async function handleScan() {
  if (!scanLabel.value) {
    toastError('Please input label number.')
    return
  }

  try {
    scanLoading.value = true
    const res = await materialReceivingStore.scanQuantityLabel(detail.value?.mr_item_id || '', { label_number: scanLabel.value })
    toastSuccess(res.message || 'Label scanned successfully.')
    scanLabel.value = ''
    await fetchDetail()
  } catch (err) {
    toastError(err)
  } finally {
    scanLoading.value = false
  }
}

// Handle scanned from camera
async function handleScannedLabel(
  value: string
) {
  scanLabel.value = value
  await handleScan()
}

// Open Incomplete Modal
function handleOpenIncomplete(
  label: QuantityCheckingLabel
) {
  incompleteModal.label = label
  incompleteModal.open = true
}

// Submit Incomplete
async function handleSubmitIncomplete(
  data: {
    actual_qty: number
  }
) {
  if (!incompleteModal.label) return

  try {
    incompleteLoading.value = true
    const res = await materialReceivingStore.markQuantityIncomplete(incompleteModal.label.id, { actual_qty: data.actual_qty })
    toastSuccess(res.message || 'Quantity marked as incomplete.')
    incompleteModal.open = false
    await fetchDetail()
  } catch (err) {
    toastError(err)
  } finally {
    incompleteLoading.value = false
  }
}

// Submit Quantity Checking
async function handleSubmitChecking() {
  if (hasRemainingQty.value) {
    confirmDialog.title = 'Incomplete Quantity Confirmation'
    confirmDialog.description = `There are still ${detail.value?.part.remaining_qty || 0} quantities that have not been scanned. Are you sure you want to continue submitting quantity checking?`
    confirmDialog.action =
      async () => {
        await submitQuantityChecking()
        confirmDialog.open = false
      }
    confirmDialog.open = true
    return
  }
  await submitQuantityChecking()
}

async function submitQuantityChecking() {
  try {
    submitLoading.value = true
    const res = await materialReceivingStore.submitQuantityChecking(mdoDetailId.value)
    toastSuccess(res.message || 'Quantity checking submitted successfully.')
    router.back()
  } catch (err) {
    toastError(err)
  } finally {
    submitLoading.value = false
  }
}

// Columns
const { columns } =
  useQuantityCheckingColumns(
    {
      onMarkIncomplete: handleOpenIncomplete,
    },
    uiComponents,
    isSubmitted
  )

// Lifecycle
onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div v-if="detail" class="p-6 space-y-6">
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
          Quantity Checking
        </h1>

        <p class="text-sm text-muted">
          Scan and validate incoming material labels.
        </p>
      </div>
    </div>

    <UCard>
      <div class="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 class="text-lg font-semibold">
            {{ detail.part.part_number }}
          </h2>

          <p class="text-sm text-muted mt-1">
            {{ detail.part.part_name }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="space-y-1">
          <div class="text-sm text-muted">
            MDO Number
          </div>

          <div class="font-medium">
            {{ detail.mdo_number || '-' }}
          </div>
        </div>

        <div class="space-y-1">
          <div class="text-sm text-muted">
            Warehouse
          </div>

          <div class="font-medium">
            {{ detail.warehouse || '-' }}
          </div>
        </div>

        <div class="space-y-1">
          <div class="text-sm text-muted">
            Dock
          </div>

          <div class="font-medium">
            {{ detail.dock || '-' }}
          </div>
        </div>

        <div class="space-y-1">
          <div class="text-sm text-muted">
            Target Date
          </div>

          <div class="font-medium">
            {{
              detail.target_date
                ? new Date(
                  detail.target_date
                ).toLocaleDateString()
                : '-'
            }}
          </div>
        </div>

        <div class="space-y-1">
          <div class="text-sm text-muted">
            Arrived At
          </div>

          <div class="font-medium">
            {{
              detail.arrived_at
                ? new Date(
                  detail.arrived_at
                ).toLocaleString()
                : '-'
            }}
          </div>
        </div>

        <div class="space-y-1">
          <div class="text-sm text-muted">
            Qty per Kanban
          </div>

          <div class="font-medium">
            {{ detail.part.qty_per_kanban || '-' }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-center">
        <UCard>
          <div class="text-sm text-muted">
            Total Qty
          </div>

          <div class="text-2xl font-bold mt-1">
            {{ detail.part.total_qty }}
          </div>
        </UCard>

        <UCard>
          <div class="text-sm text-muted">
            Checked Qty
          </div>

          <div class="text-2xl font-bold mt-1">
            {{ detail.part.checked_qty }}
          </div>
        </UCard>

        <UCard>
          <div class="text-sm text-muted">
            Remaining Qty
          </div>

          <div class="text-2xl font-bold mt-1">
            {{ detail.part.remaining_qty }}
          </div>
        </UCard>
      </div>

      <div class="mb-6 space-y-2">
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium">
            Scanning Progress
          </div>

          <div class="text-sm text-muted">
            {{ progressPercentage }}% Completed
          </div>
        </div>

        <UProgress
          :model-value="progressPercentage"
          :color="progressColor"
        />
      </div>

      <div class="mb-6">
        <div class="flex gap-3">
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-camera"
            :disabled="isSubmitted"
            @click="scannerModal.open = true"
          />

          <UInput
            v-model="scanLabel"
            placeholder="Scan/Input Label Number"
            icon="i-lucide-scan-line"
            class="flex-1"
            :disabled="isSubmitted"
            @keyup.enter="handleScan"
          />

          <UButton
            color="primary"
            :loading="scanLoading"
            :disabled="isSubmitted"
            @click="handleScan"
          >
            Add Label
          </UButton>
        </div>
      </div>

      <UTable
        :data="detail.labels || []"
        :columns="columns"
        sticky 
        class="flex-1 max-h-[380px]"
      />

      <div class="sticky bottom-0 bg-default pt-4 mt-6 flex justify-end">
        <UButton
          color="warning"
          icon="i-lucide-check-check"
          :loading="submitLoading"
          :disabled="isSubmitted"
          @click="handleSubmitChecking"
        >
          {{ isSubmitted ? 'Already Submitted' : 'Submit Quantity Checking' }}
        </UButton>
      </div>
    </UCard>

    <QuantityIncompleteModal
      v-model:open="incompleteModal.open"
      :label="incompleteModal.label"
      :qty-per-kanban="detail.part.qty_per_kanban || 0"
      :loading="incompleteLoading"
      @save="handleSubmitIncomplete"
    />

    <LabelScannerModal
      v-model:open="scannerModal.open"
      title="Scan Material Label"
      @scanned="handleScannedLabel"
    />

    <ConfirmDialog
      v-model:open="confirmDialog.open"
      :title="confirmDialog.title"
      :description="confirmDialog.description"
      confirm-label="Submit Anyway"
      :loading="submitLoading"
      @confirm="confirmDialog.action?.()"
    />
  </div>

  <div v-else class="p-6 flex items-center justify-center">
    <UProgress indicator />
  </div>
</template>