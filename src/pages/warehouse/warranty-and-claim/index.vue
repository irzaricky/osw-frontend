<script setup lang="ts">
import {
  onMounted,
  resolveComponent
} from 'vue'

import {
  storeToRefs
} from 'pinia'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'

import { useWarrantyAndClaimStore } from '../../../stores/warehouse/warranty-and-claim.store'

import { useWarrantyAndClaimColumns } from './composables/useWarrantyAndClaimColumns'

// Store
const warrantyAndClaimStore =
  useWarrantyAndClaimStore()

const {
  warrantyAndClaims,
  loading
} = storeToRefs(
  warrantyAndClaimStore
)

// UI Components
const uiComponents = {
  UBadge:
    resolveComponent(
      'UBadge'
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
    label:
      'Warranty & Claim'
  }
]

// Fetch Data
async function fetchData() {
  await warrantyAndClaimStore.fetchWarrantyAndClaims()
}

// Columns
const { columns } =
  useWarrantyAndClaimColumns(
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
        Warranty & Claim
      </h1>

      <p
        class="text-sm text-muted"
      >
        View quantity and quality non-conformance records from material receiving inspections.
      </p>

    </div>

    <UCard>

      <UTable
        :data="
          warrantyAndClaims
        "

        :columns="
          columns
        "

        :loading="
          loading
        "

        :ui="{
          td: 'py-3',
          th: 'py-3'
        }"
      />

    </UCard>

  </div>
</template>