<script setup lang="ts">
import type { GoodReceiptDetail } from '../../../../types/warehouse/good-receipt'

defineProps<{
  detail: GoodReceiptDetail
}>()

function getStatusColor(
  status?: string | null
): 'warning' | 'success' | 'neutral' {
  if (!status) {
    return 'neutral'
  }

  if (status === 'Waiting GR Approval') {
    return 'warning'
  }

  if (status === 'Good Receipt') {
    return 'success'
  }

  return 'neutral'
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">
            Good Receipt Information
          </h2>

          <p class="text-sm text-muted">
            Material receiving information and approval status.
          </p>
        </div>

        <UBadge
          :color=" getStatusColor(detail.gr_status)"
          variant="subtle"
        >
          {{ detail.gr_status || '-' }}
        </UBadge>
      </div>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div class="space-y-1">
        <div class="text-sm text-muted">
          MPO Number
        </div>

        <div class="font-medium">
          {{ detail.po_number || '-' }}
        </div>
      </div>

      <div class="space-y-1">
        <div class="text-sm text-muted">
          MDO Number
        </div>

        <div class="font-medium">
          {{ detail.do_number || '-' }}
        </div>
      </div>

      <div class="space-y-1">
        <div class="text-sm text-muted">
          Supplier
        </div>

        <div class="font-medium">
          {{ detail.supplier || '-' }}
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
          Arrived At
        </div>

        <div class="font-medium">
          {{ formatDate(detail.arrived_at) }}
        </div>
      </div>

      <div class="space-y-1">
        <div class="text-sm text-muted">
          Total Part
        </div>

        <div class="font-medium">
          {{ detail.parts?.length || 0 }}
        </div>
      </div>
    </div>
  </UCard>
</template>