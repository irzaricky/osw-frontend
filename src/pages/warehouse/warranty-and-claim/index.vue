<script setup lang="ts">
import { onMounted, resolveComponent, computed, ref, reactive } from 'vue'
import { storeToRefs } from 'pinia'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import DefectImagePreviewModal from '../good-receipt/components/DefectImagePreviewModal.vue'

import type { WarrantyAndClaim } from '../../../types/warehouse/warranty-and-claim'
import { useWarrantyAndClaimStore } from '../../../stores/warehouse/warranty-and-claim.store'
import { useWarrantyAndClaimColumns } from './composables/useWarrantyAndClaimColumns'

// Store
const warrantyAndClaimStore = useWarrantyAndClaimStore()
const { warrantyAndClaims, meta, loading } = storeToRefs(warrantyAndClaimStore)

const imagePreview = reactive({
  open: false,
  images: [] as {
    defect_name: string
    image: string
  }[]
})

// UI Components
const uiComponents = {
  UBadge: resolveComponent('UBadge'),
  UButton: resolveComponent('UButton'),
  UDropdownMenu: resolveComponent('UDropdownMenu')
}

const pagination = computed(() => ({
  page: meta.value.page,
  limit: meta.value.limit
}))

// Table state
const rowSelection = ref({})

function handleViewEvidence(
  warrantyAndClaim: WarrantyAndClaim
) {
  const images =
    (
      warrantyAndClaim.defects || []
    )
      .filter(
        defect => defect.image
      )
      .map(
        defect => ({
          defect_name: defect.defect_name || '-',
          image: defect.image
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
  { label: 'Warranty & Claim' }
]

// Fetch Data
async function fetchData() {
  const params: Record<string, any> = {
    page: meta.value.page,
    limit: meta.value.limit
  }

  await warrantyAndClaimStore.fetchWarrantyAndClaims(params)
}

// Columns
const { columns } = useWarrantyAndClaimColumns({
  onViewEvidence: handleViewEvidence
}, uiComponents, pagination)

// Lifecycle
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div>
      <h1 class="text-2xl font-bold">
        Warranty & Claim
      </h1>

      <p class="text-sm text-muted">
        View quantity and quality non-conformance records from material receiving inspections.
      </p>
    </div>

    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      :data="loading ? [] : warrantyAndClaims"
      :columns="columns"
      :loading="loading"
      class="w-full"
    />

    <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
      <div class="text-sm text-muted">
        Total {{ meta.total }} NG ticket(s).
      </div>
      <UPagination
        v-model:page="meta.page"
        :total="meta.total"
        :items-per-page="meta.limit"
        @update:page="fetchData"
      />
    </div>
  </div>

  <DefectImagePreviewModal
    v-model:open="imagePreview.open"
    :images="imagePreview.images"
  />
</template>