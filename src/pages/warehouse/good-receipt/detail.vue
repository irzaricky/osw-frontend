<script setup lang="ts">
import { ref, computed, onMounted, resolveComponent, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import GoodReceiptDetailHeader from './components/GoodReceiptDetailHeader.vue'
import GoodReceiptPartSelector from './components/GoodReceiptPartSelector.vue'
import DefectImagePreviewModal from './components/DefectImagePreviewModal.vue'

import { useGoodReceiptStore } from '../../../stores/warehouse/good-receipt.store'
import { useGoodReceiptQuantityLabelColumns } from './composables/useGoodReceiptQuantityLabelColumns'
import { useGoodReceiptQualityLabelColumns } from './composables/useGoodReceiptQualityLabelColumns'
import type { GoodReceiptDetail, GoodReceiptPart, GoodReceiptQualityLabel } from '../../../types/warehouse/good-receipt'

// Router
const router = useRouter()
const route = useRoute()

// Store
const goodReceiptStore = useGoodReceiptStore()
const { loading } = storeToRefs(goodReceiptStore)

// State
const detail = ref<GoodReceiptDetail | null>(null)
const selectedPart = ref<GoodReceiptPart | undefined>()

const imagePreview = reactive({
  open: false,
  images: [] as {
    defect_name: string
    image: string
  }[]
})

const mrId = computed(() => route.params.id as string)

// UI Components
const uiComponents = {
  UBadge: resolveComponent('UBadge'),
  UButton: resolveComponent('UButton'),
  UDropdownMenu: resolveComponent('UDropdownMenu')
}

// Columns
const { columns: quantityColumns } = useGoodReceiptQuantityLabelColumns(
  uiComponents
)

const { columns: qualityColumns } = useGoodReceiptQualityLabelColumns(
  {
    onViewImages: handleViewImages
  },
  uiComponents
)

// Tabs
const tabs = [
  {
    label: 'Quantity Checking',
    slot: 'quantity'
  },
  {
    label: 'Quality Checking',
    slot: 'quality'
  }
]

function handleViewImages(
  label: GoodReceiptQualityLabel
) {
  const images =
    (
      label.defects || []
    )
      .filter(
        defect => defect.image
      )
      .map(
        defect => ({
          defect_name: defect.defect_name || '-',
          image: defect.image!
        })
      )

  if (!images.length) {
    return
  }

  imagePreview.images = images
  imagePreview.open = true
}

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Warehouse' },
  { label: 'Good Receipt', to: '/warehouse/good-receipt' },
  { label: 'Good Receipt Detail' }
]

// Fetch detail
async function fetchDetail() {
  const response = await goodReceiptStore.fetchGoodReceipt(mrId.value)
  detail.value = response
  selectedPart.value = response?.parts?.[0]
}

// Lifecycle
onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div v-if="!loading && detail">
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
            Good Receipt Detail
          </h1>

          <p class="text-sm text-muted">
            View quantity and quality inspection results.
          </p>
        </div>
      </div>

      <GoodReceiptDetailHeader
        :detail="detail"
      />

      <GoodReceiptPartSelector
        v-model="selectedPart"
        :parts="detail.parts"
      />

      <UCard>
        <UTabs :items="tabs" class="gap-4">
          <template #quantity>
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <UCard>
                  <div class="text-sm text-muted">
                    Expected Qty
                  </div>

                  <div class="text-2xl font-semibold">
                    {{ selectedPart?.quantity_summary.expected || 0 }}
                  </div>
                </UCard>

                <UCard>
                  <div class="text-sm text-muted">
                    Accepted Qty
                  </div>

                  <div class="text-2xl font-semibold">
                    {{ selectedPart?.quantity_summary.accepted || 0 }}
                  </div>
                </UCard>

                <UCard>
                  <div class="text-sm text-muted">
                    Rejected Qty
                  </div>

                  <div class="text-2xl font-semibold">
                    {{ selectedPart?.quantity_summary.rejected || 0 }}
                  </div>
                </UCard>

                <UCard>
                  <div class="text-sm text-muted">
                    Submitted At
                  </div>

                  <div class="font-medium">
                    {{
                      selectedPart
                        ?.quantity_summary
                        .submitted_at
                        ? new Date(
                            selectedPart.quantity_summary.submitted_at
                          ).toLocaleString()
                        : '-'
                    }}
                  </div>
                </UCard>
              </div>

              <UTable
                ref="table"
                :data=" selectedPart?.quantity_labels || []"
                :columns="quantityColumns"
                sticky 
                class="flex-1 max-h-[620px]"
              />
            </div>
          </template>

          <template #quality>
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <UCard>
                  <div class="text-sm text-muted">
                    Expected Qty
                  </div>

                  <div class="text-2xl font-semibold">
                    {{ selectedPart?.quality_summary.expected || 0 }}
                  </div>
                </UCard>

                <UCard>
                  <div class="text-sm text-muted">
                    Accepted Qty
                  </div>

                  <div class="text-2xl font-semibold">
                    {{ selectedPart?.quality_summary.accepted || 0 }}
                  </div>
                </UCard>

                <UCard>
                  <div class="text-sm text-muted">
                    Rejected Qty
                  </div>

                  <div class="text-2xl font-semibold">
                    {{ selectedPart?.quality_summary.rejected || 0 }}
                  </div>
                </UCard>

                <UCard>
                  <div class="text-sm text-muted">
                    Submitted At
                  </div>

                  <div class="font-medium">
                    {{
                      selectedPart
                        ?.quality_summary
                        .submitted_at
                        ? new Date(
                            selectedPart.quality_summary.submitted_at
                          ).toLocaleString()
                        : '-'
                    }}
                  </div>
                </UCard>
              </div>

              <UTable
                ref="table"
                :data="selectedPart?.quality_labels || []"
                :columns="qualityColumns"
                sticky 
                class="flex-1 max-h-[620px]"
              />
            </div>
          </template>
        </UTabs>
      </UCard>
    </div>
  </div>
  
  <div v-else class="p-6 flex items-center justify-center">
    <UProgress indicator />
  </div>

  <DefectImagePreviewModal
    v-model:open="imagePreview.open"
    :images="imagePreview.images"
  />
</template>