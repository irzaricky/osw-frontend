<script setup lang="ts">
import { ref, onMounted, computed, resolveComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import { useMaterialReceivingStore } from '../../../../stores/warehouse/material-receiving.store'
import { useMaterialReceivingProgressColumns } from '../composables/useMaterialReceivingProgressColumns'

import Breadcrumbs from '../../../../components/Breadcrumbs.vue'

// Store
const materialReceivingStore = useMaterialReceivingStore()
const { loading } = storeToRefs(materialReceivingStore)

const router = useRouter()
const route = useRoute()

const uiComponents = {
  UBadge: resolveComponent('UBadge'),
  UButton: resolveComponent('UButton'),
  UDropdownMenu: resolveComponent('UDropdownMenu')
}

// State
const progress = ref<any>(null)

const mdoId = computed(() => route.params.id as string)

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Warehouse' },
  { label: 'Material Receiving', to: '/warehouse/material-receiving' },
  { label: 'View Progress' }
]

// Status Badge Color
function getStatusColor(
  status?: string
): 'neutral' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' {
  if (!status) return 'neutral'

  const colors: Record<
    string,
    'neutral' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error'
  > = {
    'in transit': 'neutral',
    'arrived': 'info',
    'quantity checking': 'warning',
    'quality checking': 'error',
    'waiting gr approval': 'secondary',
    'good receipt': 'success'
  }

  return colors[status.toLowerCase()] || 'neutral'
}

// Columns
const columns = computed(() => {
  return useMaterialReceivingProgressColumns(
    progress.value?.status || '',
    {
      onQuantityCheck: handleQuantityCheck,
      onQualityCheck: () => {}
    },
    uiComponents
  ).columns
})

function handleQuantityCheck(item: any) {
  router.push(
    `/warehouse/material-receiving/view-progress/${progress.value?.id}/quantity-checking/${item.id}`
  )
}

// Fetch Progress
async function fetchProgress() {
  const response = await materialReceivingStore.fetchProgress(mdoId.value)
  progress.value = response
}

// Lifecycle
onMounted(() => {
  fetchProgress()
})
</script>

<template>
  <div v-if="!loading && progress">
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
            View Progress
          </h1>

          <p class="text-sm text-muted">
            View quantity and quality checking progress for incoming materials.
          </p>
        </div>
      </div>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">
              Material Receiving Information
            </h2>

            <UBadge :color="getStatusColor(progress.status)" variant="subtle">
              {{ progress.status || '-' }}
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <UFormField label="MDO Number">
            <UInput :model-value="progress.number" disabled class="w-full" />
          </UFormField>

          <UFormField label="Target Date">
            <UInput
              :model-value="
                progress.target_date
                  ? new Date(progress.target_date).toLocaleDateString()
                  : '-'
              "
              disabled
              class="w-full"
            />
          </UFormField>

          <UFormField label="Arrived At">
            <UInput
              :model-value="
                progress.arrived_at
                  ? new Date(progress.arrived_at).toLocaleString()
                  : '-'
              "
              disabled
              class="w-full"
            />
          </UFormField>

          <UFormField label="Warehouse">
            <UInput :model-value="progress.warehouse || '-'" disabled class="w-full" />
          </UFormField>

          <UFormField label="Dock">
            <UInput :model-value="progress.dock || '-'" disabled class="w-full" />
          </UFormField>
        </div>

        <UTable
          :data="progress.items || []"
          :columns="columns"
        />
      </UCard>
    </div>
  </div>

  <div v-else class="p-6 flex items-center justify-center">
    <UProgress indicator />
  </div>
</template>