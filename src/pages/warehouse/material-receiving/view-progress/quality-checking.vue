<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  resolveComponent,
  reactive
} from 'vue'

import {
  useRoute,
  useRouter
} from 'vue-router'

import Breadcrumbs from '../../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../../components/ConfirmDialog.vue'

import LabelScannerModal from '../components/LabelScannerModal.vue'
import QualityDefectFormModal from '../components/QualityDefectFormModal.vue'

import { useMaterialReceivingStore } from '../../../../stores/warehouse/material-receiving.store'
import { useDefectStore } from '../../../../stores/master-data/defect.store'

import { useQualityCheckingColumns } from '../composables/useQualityCheckingColumns'

import { useAppToast } from '../../../../composables/useAppToast'

import type {
  QualityCheckingDetail,
  QualityCheckingLabel
} from '../../../../types/warehouse/material-receiving'

// Store
const router = useRouter()
const route = useRoute()

const materialReceivingStore =
  useMaterialReceivingStore()
const defectStore = useDefectStore()

const {
  toastSuccess,
  toastError
} = useAppToast()

// UI Components
const uiComponents = {
  UBadge: resolveComponent('UBadge'),
  UButton: resolveComponent('UButton'),
  UDropdownMenu: resolveComponent('UDropdownMenu')
}

// Loading
const pageLoading = ref(false)
const scanLoading = ref(false)
const submitLoading = ref(false)
const defectLoading = ref(false)

// State
const detail =
  ref<QualityCheckingDetail | null>(
    null
  )

const scanLabel = ref('')

const defects = computed(() => defectStore.dropdown)

// Scanner Modal
const scannerModal = reactive({
  open: false
})

// Defect Modal
const defectModal = reactive({
  open: false,

  label:
    null as
      | QualityCheckingLabel
      | null
})

// Confirm Dialog
const confirmDialog = reactive({
  open: false,
  title: '',
  description: '',
  action:
    null as
      | (() => Promise<void>)
      | null
})

const mdoDetailId = computed(
  () =>
    route.params
      .mdo_detail_id as string
)

const isSubmitted = computed(() => {
  return !!detail.value?.submitted_at
})

const progressPercentage =
  computed(() => {
    const total = Number(
      detail.value?.part
        .total_qty || 0
    )

    const checked = Number(
      detail.value?.part
        .checked_qty || 0
    )

    if (total <= 0) {
      return 0
    }

    return Math.round(
      (checked / total) * 100
    )
  })

const progressColor =
  computed(() => {
    if (
      progressPercentage.value >=
      100
    ) {
      return 'success'
    }

    if (
      progressPercentage.value >=
      50
    ) {
      return 'warning'
    }

    return 'error'
  })

const hasRemainingQty =
  computed(() => {
    return (
      Number(
        detail.value?.part
          .remaining_qty || 0
      ) > 0
    )
  })

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },

  { label: 'Warehouse' },

  {
    label:
      'Material Receiving',

    to: '/warehouse/material-receiving'
  },

  {
    label: 'View Progress',

    to:
      `/warehouse/material-receiving/view-progress/${route.params.id}`
  },

  {
    label:
      'Quality Checking'
  }
]

// Fetch Detail
async function fetchDetail() {
  try {
    pageLoading.value = true

    const response =
      await materialReceivingStore.fetchQualityCheckingDetail(
        mdoDetailId.value
      )

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
    toastError(
      'Please input label number.'
    )

    return
  }

  try {
    scanLoading.value = true

    const res =
      await materialReceivingStore.scanQualityLabel(
        {
          label_number:
            scanLabel.value
        }
      )

    toastSuccess(
      res.message ||
      'Label scanned successfully.'
    )

    scanLabel.value = ''

    await fetchDetail()
  } catch (err) {
    toastError(err)
  } finally {
    scanLoading.value = false
  }
}

// Camera Scanner
async function handleScannedLabel(
  value: string
) {
  scanLabel.value = value

  await handleScan()
}

// Open Defect Modal
function handleOpenDefect(
  label: QualityCheckingLabel
) {
  defectModal.label = label
  defectModal.open = true
}

// Submit Defect
async function handleSubmitDefect(
  data: any
) {
  if (!defectModal.label) {
    return
  }

  try {
    defectLoading.value = true

    const res =
      await materialReceivingStore.markQualityDefect(
        defectModal.label.id,
        data
      )

    toastSuccess(
      res.message ||
      'Quality defect marked successfully.'
    )

    defectModal.open = false

    await fetchDetail()
  } catch (err) {
    toastError(err)
  } finally {
    defectLoading.value = false
  }
}

// Submit Quality Checking
async function submitQualityChecking() {
  try {
    submitLoading.value = true

    const res =
      await materialReceivingStore.submitQualityChecking(
        mdoDetailId.value
      )

    toastSuccess(
      res.message ||
      'Quality checking submitted successfully.'
    )

    router.back()
  } catch (err) {
    toastError(err)
  } finally {
    submitLoading.value = false
  }
}

async function handleSubmitChecking() {
  if (hasRemainingQty.value) {

    confirmDialog.title =
      'Incomplete Quality Confirmation'

    confirmDialog.description =
      `There are still ${detail.value?.part.remaining_qty || 0} quantities that have not been checked. If you continue, the remaining unscanned labels will be automatically marked as judgement OK. Do you want to continue?`

    confirmDialog.action =
      async () => {
        await submitQualityChecking()

        confirmDialog.open = false
      }

    confirmDialog.open = true

    return
  }

  await submitQualityChecking()
}

// Columns
const { columns } =
  useQualityCheckingColumns(
    {
      onMarkDefect:
        handleOpenDefect
    },

    uiComponents,

    isSubmitted
  )

// Lifecycle
onMounted(async () => {
  await Promise.all([
    defectStore.fetchDropdown(),
    fetchDetail()
  ])
})
</script>

<template>
  <div
    v-if="!pageLoading && detail"
    class="p-6 space-y-6"
  >

    <Breadcrumbs
      :items="breadcrumbItems"
    />

    <div class="flex items-center gap-4">

      <UButton
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        @click="router.back()"
      />

      <div>

        <h1
          class="text-2xl font-bold"
        >
          Quality Checking
        </h1>

        <p
          class="text-sm text-muted"
        >
          Inspect and validate
          incoming material quality.
        </p>

      </div>

    </div>

    <UCard>

      <div
        class="flex items-start justify-between gap-4 mb-6"
      >

        <div>

          <h2
            class="text-lg font-semibold"
          >
            {{
              detail.part.part_number
            }}
          </h2>

          <p
            class="text-sm text-muted mt-1"
          >
            {{
              detail.part.part_name
            }}
          </p>

        </div>

      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
      >

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

      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
      >

        <UCard>
          <div
            class="text-sm text-muted"
          >
            Total Qty
          </div>

          <div
            class="text-2xl font-bold mt-1"
          >
            {{
              detail.part.total_qty
            }}
          </div>
        </UCard>

        <UCard>
          <div
            class="text-sm text-muted"
          >
            Checked Qty
          </div>

          <div
            class="text-2xl font-bold mt-1"
          >
            {{
              detail.part.checked_qty
            }}
          </div>
        </UCard>

        <UCard>
          <div
            class="text-sm text-muted"
          >
            Remaining Qty
          </div>

          <div
            class="text-2xl font-bold mt-1"
          >
            {{
              detail.part.remaining_qty
            }}
          </div>
        </UCard>

      </div>

      <div class="mb-6 space-y-2">

        <div
          class="flex items-center justify-between"
        >

          <div
            class="text-sm font-medium"
          >
            Progress
          </div>

          <div
            class="text-sm text-muted"
          >
            {{
              progressPercentage
            }}% Completed
          </div>

        </div>

        <UProgress
          :model-value="
            progressPercentage
          "

          :color="
            progressColor
          "
        />

      </div>

      <div class="mb-6">

        <div class="flex gap-3">

          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-camera"

            :disabled="
              isSubmitted
            "

            @click="
              scannerModal.open = true
            "
          />

          <UInput
            v-model="scanLabel"

            placeholder="Input or scan label number"

            icon="i-lucide-scan-line"

            class="flex-1"

            :disabled="
              isSubmitted
            "

            @keyup.enter="
              handleScan
            "
          />

          <UButton
            color="primary"

            icon="i-lucide-plus"

            :loading="
              scanLoading
            "

            :disabled="
              isSubmitted
            "

            @click="
              handleScan
            "
          >
            Add Label
          </UButton>

        </div>

      </div>

      <div
        class="max-h-[400px] overflow-auto"
      >

        <UTable
          :data="
            detail.labels || []
          "

          :columns="columns"
        />

      </div>

      <div
        class="sticky bottom-0 bg-default pt-4 mt-6 flex justify-end"
      >

        <UButton
          color="warning"

          icon="i-lucide-check-check"

          :loading="
            submitLoading
          "

          :disabled="
            isSubmitted
          "

          @click="
            handleSubmitChecking
          "
        >
          {{
            isSubmitted
              ? 'Already Submitted'
              : 'Submit Quality Checking'
          }}
        </UButton>

      </div>

    </UCard>

    <QualityDefectFormModal
      v-model:open="
        defectModal.open
      "

      :label="
        defectModal.label
      "

      :defects="
        defects
      "

      :loading="
        defectLoading
      "

      @save="
        handleSubmitDefect
      "
    />

    <LabelScannerModal
      v-model:open="
        scannerModal.open
      "

      title="Scan Quality Label"

      @scanned="
        handleScannedLabel
      "
    />

    <ConfirmDialog
      v-model:open="
        confirmDialog.open
      "

      :title="
        confirmDialog.title
      "

      :description="
        confirmDialog.description
      "

      confirm-label="Submit Anyway"

      :loading="
        submitLoading
      "

      @confirm="
        confirmDialog.action?.()
      "
    />

  </div>

  <div
    v-else
    class="p-6 flex items-center justify-center"
  >
    <UProgress indicator />
  </div>
</template>