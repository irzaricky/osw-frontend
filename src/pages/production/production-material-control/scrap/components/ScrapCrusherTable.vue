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

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID')
}

const columns: TableColumn<any>[] = [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => (props.page - 1) * props.limit + row.index + 1
  },
  {
    accessorKey: 'scrap_date',
    header: 'Scrap Date',
    cell: ({ row }) => formatDate(row.original.scrap_date)
  },
  {
    accessorKey: 'product_part_number',
    header: 'Product',
    cell: ({ row }) => row.original.product_part_number || '-'
  },
  {
    accessorKey: 'material_part_number',
    header: 'Material',
    cell: ({ row }) => row.original.material_part_number || '-'
  },
  {
    accessorKey: 'qty_scrap',
    header: 'Qty Scrap',
    cell: ({ row }) =>
      h(UBadge, { color: 'error', variant: 'soft' }, () => `${row.original.qty_scrap} PCS`)
  },
  {
    accessorKey: 'weight_per_pcs',
    header: 'Weight / PCS',
    cell: ({ row }) => `${row.original.weight_per_pcs || 0} kg`
  },
  {
    accessorKey: 'total_weight',
    header: 'Total Weight',
    cell: ({ row }) =>
      h(UBadge, { color: 'warning', variant: 'soft' }, () => `${row.original.total_weight || 0} kg`)
  },
  {
    accessorKey: 'remarks',
    header: 'Remarks',
    cell: ({ row }) => row.original.remarks || '-'
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
              Scrap Info
            </h4>
            <p class="text-sm">
              <span class="text-muted">Production Result ID:</span>
              {{ row.original.production_result_id }}
            </p>
            <p class="text-sm">
              <span class="text-muted">Scrap Date:</span>
              {{ formatDate(row.original.scrap_date) }}
            </p>
          </div>

          <div class="space-y-1">
            <h4 class="font-semibold text-sm text-highlighted">
              Part & Material
            </h4>
            <p class="text-sm">
              <span class="text-muted">Product:</span>
              {{ row.original.product_part_number }} - {{ row.original.product_part_name }}
            </p>
            <p class="text-sm">
              <span class="text-muted">Material:</span>
              {{ row.original.material_part_number }} - {{ row.original.material_part_name }}
            </p>
          </div>

          <div class="space-y-1">
            <h4 class="font-semibold text-sm text-highlighted">
              Crusher
            </h4>
            <p class="text-sm">
              <span class="text-muted">Qty Scrap:</span>
              {{ row.original.qty_scrap }} PCS
            </p>
            <p class="text-sm">
              <span class="text-muted">Weight / PCS:</span>
              {{ row.original.weight_per_pcs }} kg
            </p>
            <p class="text-sm">
              <span class="text-muted">Total Weight:</span>
              {{ row.original.total_weight }} kg
            </p>
          </div>
        </div>
      </template>
    </UTable>

    <div v-if="!loading && !data.length" class="py-10 text-center text-muted">
      No scrap / crusher data found.
    </div>
  </UCard>
</template>