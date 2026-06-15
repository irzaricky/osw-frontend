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

const columns: TableColumn<any>[] = [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => (props.page - 1) * props.limit + row.index + 1
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ row }) => formatDateTime(row.original.created_at)
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
    accessorKey: 'qty_replacement',
    header: 'Qty Replacement',
    cell: ({ row }) =>
      h(UBadge, { color: 'warning', variant: 'soft' }, () => `${row.original.qty_replacement} PCS`)
  },
  {
    accessorKey: 'replacement_reason',
    header: 'Reason',
    cell: ({ row }) => row.original.replacement_reason || '-'
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
              Replacement Info
            </h4>

            <p class="text-sm">
              <span class="text-muted">Production Result ID:</span>
              {{ row.original.production_result_id }}
            </p>

            <p class="text-sm">
              <span class="text-muted">Date:</span>
              {{ formatDateTime(row.original.created_at) }}
            </p>
          </div>

          <div class="space-y-1">
            <h4 class="font-semibold text-sm text-highlighted">
              Station & Material
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
              Usage
            </h4>

            <p class="text-sm">
              <span class="text-muted">Qty Replacement:</span>
              {{ row.original.qty_replacement }} PCS
            </p>

            <p class="text-sm">
              <span class="text-muted">Reason:</span>
              {{ row.original.replacement_reason || '-' }}
            </p>
          </div>
        </div>
      </template>
    </UTable>

    <div v-if="!loading && !data.length" class="py-10 text-center text-muted">
      No material replacement found.
    </div>
  </UCard>
</template>