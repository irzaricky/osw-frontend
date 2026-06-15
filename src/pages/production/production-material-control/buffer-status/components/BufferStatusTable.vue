<script setup lang="ts">
import { h, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

const props = defineProps<{
  data: any[]
  loading?: boolean
  page: number
  limit: number
}>()

const expanded = ref({})
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID')
}

function getStatusColor(status?: string) {
  if (status === 'Need Replenishment') return 'warning'
  if (status === 'Empty') return 'error'
  return 'success'
}

function getAgingColor(days?: number) {
  if (Number(days || 0) >= 30) return 'error'
  if (Number(days || 0) >= 7) return 'warning'
  return 'success'
}

const columns: TableColumn<any>[] = [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => (props.page - 1) * props.limit + row.index + 1
  },
  {
    accessorKey: 'station_name',
    header: 'Station',
    cell: ({ row }) => row.original.station_name || '-'
  },
  {
    accessorKey: 'part_number',
    header: 'Material',
    cell: ({ row }) => row.original.part_number || '-'
  },
  {
    accessorKey: 'part_name',
    header: 'Material Name',
    cell: ({ row }) => row.original.part_name || '-'
  },
  {
    accessorKey: 'qty_pcs',
    header: 'Current Buffer',
    cell: ({ row }) => `${row.original.qty_pcs || 0} PCS`
  },
  {
    accessorKey: 'standard_buffer_stock',
    header: 'Standard Buffer',
    cell: ({ row }) => `${row.original.standard_buffer_stock || 0} PCS`
  },
  {
    accessorKey: 'shortage_pcs',
    header: 'Shortage',
    cell: ({ row }) => `${row.original.shortage_pcs || 0} PCS`
  },
  {
    accessorKey: 'aging_days',
    header: 'Aging',
    cell: ({ row }) =>
      h(
        UBadge,
        {
          color: getAgingColor(row.original.aging_days),
          variant: 'soft'
        },
        () => `${row.original.aging_days || 0} day(s)`
      )
  },
  {
    accessorKey: 'buffer_status',
    header: 'Status',
    cell: ({ row }) =>
      h(
        UBadge,
        {
          color: getStatusColor(row.original.buffer_status),
          variant: 'soft'
        },
        () => row.original.buffer_status || 'Safe'
      )
  },
  {
    id: 'expand',
    cell: ({ row }) =>
      h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        icon: row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right',
        onClick: () => row.toggleExpanded()
      })
  }
]
</script>

<template>
  <UCard>
    <UTable
      v-model:expanded="expanded"
      :data="loading ? [] : data"
      :columns="columns"
      :loading="loading"
      class="w-full"
    >
      <template #expanded="{ row }">
        <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-elevated/50 border-b border-default">
          <div class="space-y-1">
            <h4 class="font-semibold text-sm text-highlighted">
              Buffer Location
            </h4>
            <p class="text-sm">
              <span class="text-muted">Station:</span>
              {{ row.original.station_name || '-' }}
            </p>
            <p class="text-sm">
              <span class="text-muted">Material:</span>
              {{ row.original.part_number }} - {{ row.original.part_name }}
            </p>
          </div>

          <div class="space-y-1">
            <h4 class="font-semibold text-sm text-highlighted">
              Buffer Quantity
            </h4>
            <p class="text-sm">
              <span class="text-muted">Current:</span>
              {{ row.original.qty_pcs || 0 }} PCS
            </p>
            <p class="text-sm">
              <span class="text-muted">Standard:</span>
              {{ row.original.standard_buffer_stock || 0 }} PCS
            </p>
            <p class="text-sm">
              <span class="text-muted">Shortage:</span>
              {{ row.original.shortage_pcs || 0 }} PCS
            </p>
          </div>

          <div class="space-y-1">
            <h4 class="font-semibold text-sm text-highlighted">
              Aging
            </h4>
            <p class="text-sm">
              <span class="text-muted">Oldest Supply:</span>
              {{ formatDateTime(row.original.oldest_supply_at) }}
            </p>
            <p class="text-sm">
              <span class="text-muted">Latest Supply:</span>
              {{ formatDateTime(row.original.latest_supply_at) }}
            </p>
            <p class="text-sm">
              <span class="text-muted">Aging:</span>
              {{ row.original.aging_days || 0 }} day(s)
            </p>
          </div>
        </div>
      </template>
    </UTable>

    <div v-if="!loading && !data.length" class="py-10 text-center text-muted">
      No buffer status found.
    </div>
  </UCard>
</template>