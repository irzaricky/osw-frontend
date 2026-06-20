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
        <div class="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-elevated/50 border-b border-default">
          <div class="space-y-1">
            <h4 class="font-semibold text-sm text-highlighted">
              Scrap Info
            </h4>

            <p class="text-sm">
              <span class="text-muted">Production Result ID:</span>
              {{ row.original.production_result_id }}
            </p>

            <p class="text-sm">
              <span class="text-muted">Replacement ID:</span>
              {{ row.original.replacement_id || '-' }}
            </p>

            <p class="text-sm">
              <span class="text-muted">Scrap Date:</span>
              {{ formatDate(row.original.scrap_date) }}
            </p>

            <p class="text-sm">
              <span class="text-muted">Created By:</span>
              {{ row.original.created_by_email || '-' }}
            </p>
          </div>

          <div class="space-y-1">
            <h4 class="font-semibold text-sm text-highlighted">
              NG Material
            </h4>

            <p class="text-sm">
              <span class="text-muted">Product:</span>
              {{ row.original.product_part_number || '-' }}
              <span v-if="row.original.product_part_name">
                - {{ row.original.product_part_name }}
              </span>
            </p>

            <p class="text-sm">
              <span class="text-muted">Material:</span>
              {{ row.original.material_part_number || '-' }}
              <span v-if="row.original.material_part_name">
                - {{ row.original.material_part_name }}
              </span>
            </p>

            <p class="text-sm">
              <span class="text-muted">NG Label:</span>
              {{ row.original.ng_source_label_number || '-' }}
            </p>
          </div>

          <div class="space-y-2">
            <h4 class="font-semibold text-sm text-highlighted">
              Replacement Labels
            </h4>

            <div
              v-if="row.original.replacement_labels?.length"
              class="max-h-48 overflow-y-auto flex flex-wrap gap-2"
            >
              <UBadge
                v-for="label in row.original.replacement_labels"
                :key="label.id"
                color="primary"
                variant="soft"
              >
                {{ label.pcs_label_number }}
              </UBadge>
            </div>

            <p
              v-else
              class="text-sm text-muted"
            >
              No replacement label found
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

            <p class="text-sm">
              <span class="text-muted">Remarks:</span>
              {{ row.original.remarks || '-' }}
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