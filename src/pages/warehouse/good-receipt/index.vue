<script setup lang="ts">
import {
  onMounted,
  reactive,
  resolveComponent
} from 'vue'

import {
  storeToRefs
} from 'pinia'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'

import ApproveGoodReceiptModal from './components/ApproveGoodReceiptModal.vue'

import { useGoodReceiptStore } from '../../../stores/warehouse/good-receipt.store'

import { useGoodReceiptColumns } from './composables/useGoodReceiptColumns'

import { useAppToast } from '../../../composables/useAppToast'

import type {
  GoodReceipt
} from '../../../types/warehouse/good-receipt'

// Store
const goodReceiptStore =
  useGoodReceiptStore()

const {
  goodReceipts,
  loading
} = storeToRefs(
  goodReceiptStore
)

const {
  toastSuccess,
  toastError
} = useAppToast()

// UI Components
const uiComponents = {
  UBadge:
    resolveComponent(
      'UBadge'
    ),

  UButton:
    resolveComponent(
      'UButton'
    ),

  UDropdownMenu:
    resolveComponent(
      'UDropdownMenu'
    )
}

// Breadcrumbs
const breadcrumbItems = [
  {
    label: 'Home',
    to: '/'
  },

  {
    label: 'Warehouse'
  },

  {
    label: 'Good Receipt'
  }
]

// Modal
const approveModal = reactive({
  open: false,

  receipt:
    null as
      | GoodReceipt
      | null
})

// Open Approve Modal
function handleOpenApprove(
  receipt: GoodReceipt
) {
  approveModal.receipt =
    receipt

  approveModal.open = true
}

// Submit Approve
async function handleApprove(
  data: {
    remarks?: string
  }
) {
  if (
    !approveModal.receipt
  ) {
    return
  }

  try {

    const res =
      await goodReceiptStore.approveGoodReceipt(
        approveModal
          .receipt.id,

        data
      )

    toastSuccess(
      res.message ||
      'Good receipt approved successfully.'
    )

    approveModal.open =
      false

    await fetchData()

  } catch (err) {
    toastError(err)
  }
}

// Fetch Data
async function fetchData() {
  await goodReceiptStore.fetchGoodReceipts()
}

// Columns
const { columns } =
  useGoodReceiptColumns(
    {
      onApprove:
        handleOpenApprove
    },

    uiComponents
  )

// Lifecycle
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="p-6 space-y-6">

    <Breadcrumbs
      :items="breadcrumbItems"
    />

    <div>

      <h1
        class="text-2xl font-bold"
      >
        Good Receipt
      </h1>

      <p
        class="text-sm text-muted"
      >
        Manage and approve completed material receiving inspections.
      </p>

    </div>

    <UCard>

      <UTable
        :data="goodReceipts"

        :columns="columns"

        :loading="loading"
      />

    </UCard>

    <ApproveGoodReceiptModal
      v-model:open="
        approveModal.open
      "

      :receipt="
        approveModal.receipt
      "

      :loading="
        loading
      "

      @save="
        handleApprove
      "
    />

  </div>
</template>