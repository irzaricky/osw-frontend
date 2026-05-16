<script setup lang="ts">
import { reactive, watch, computed, resolveComponent } from 'vue'
import type { MaterialReceivingDetail } from '../../../../types/warehouse/material-receiving'
import { useMaterialReceivingItemColumns } from '../composables/useMaterialReceivingItemColumns'

const UButton = resolveComponent('UButton')

const props = defineProps<{
  materialReceiving: Partial<MaterialReceivingDetail>
  loading: boolean
}>()

const emit = defineEmits<{
  arrived: [remarks: string]
  printLabel: [item: any]
}>()

const state = reactive({
  remarks: ''
})

watch(
  () => props.materialReceiving,
  (val) => {
    state.remarks = val?.remarks || ''
  },
  {
    immediate: true,
    deep: true
  }
)

const isArrived = computed(() => {
  return props.materialReceiving.status !== 'In Transit'
})

function getStatusColor(status?: string): 'neutral' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' {
  if (!status) return 'neutral'

  const colors: Record<string, 'neutral' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' > = {
    'in transit': 'neutral',
    'arrived': 'info',
    'quantity checking': 'warning',
    'quality checking': 'error',
    'waiting gr approval': 'secondary',
    'good receipt': 'success'
  }

  return colors[status.toLowerCase()] || 'neutral'
}

function handlePrintLabel(item: any) {
  emit('printLabel', item)
}

const { columns } = useMaterialReceivingItemColumns(
  isArrived.value,
  {
    onPrintLabel: handlePrintLabel
  },
  {
    UButton
  }
)
</script>

<template>
  <div class="space-y-6">

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">
            Material Receiving Information
          </h2>

          <UBadge :color="getStatusColor(materialReceiving.status)" variant="subtle">
            {{ materialReceiving.status || '-' }}
          </UBadge>
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UFormField label="MDO Number" class="md:col-span-3">
          <UInput :model-value="materialReceiving.number" disabled class="w-full" />
        </UFormField>

        <UFormField label="Supplier">
          <UInput :model-value="materialReceiving.supplier?.name" disabled class="w-full" />
        </UFormField>

        <UFormField label="Warehouse">
          <UInput :model-value="materialReceiving.warehouse?.name" disabled class="w-full" />
        </UFormField>

        <UFormField label="Dock">
          <UInput :model-value="materialReceiving.dock?.name" disabled class="w-full" />
        </UFormField>

        <UFormField label="Transporter">
          <UInput :model-value="materialReceiving.transporter" disabled class="w-full" />
        </UFormField>

        <UFormField label="Target Date">
          <UInput
            :model-value="
              materialReceiving.target_date
                ? new Date(materialReceiving.target_date).toLocaleDateString()
                : '-'
            "
            disabled class="w-full" 
          />
        </UFormField>

        <UFormField label="Arrived At">
          <UInput
            :model-value="
              materialReceiving.arrived_at
                ? new Date(materialReceiving.arrived_at).toLocaleString()
                : '-'
            "
            disabled class="w-full"
          />
        </UFormField>

        <div class="md:col-span-3">
          <UFormField label="Description">
            <UInput :model-value="materialReceiving.description" disabled class="w-full" />
          </UFormField>
        </div>

        <div class="md:col-span-3">
          <UFormField label="Remarks">
            <UInput v-if="!isArrived" v-model="state.remarks" placeholder="Input remarks..." class="w-full" />
            <UInput v-else :model-value="state.remarks || '-'" disabled class="w-full" />
          </UFormField>
        </div>

      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">
            Items
          </h3>
        </div>
      </template>

      <UTable
        :data="materialReceiving.items || []"
        :columns="columns"
        :ui="{ td: 'py-3', th: 'py-3' }"
      />
    </UCard>

    <div v-if="materialReceiving.status === 'In Transit'" class="flex justify-end">
      <UButton
        color="primary"
        icon="i-lucide-package-check"
        :loading="loading"
        @click="emit('arrived', state.remarks)"
      >
        Mark as Arrived
      </UButton>
    </div>
  </div>
</template>