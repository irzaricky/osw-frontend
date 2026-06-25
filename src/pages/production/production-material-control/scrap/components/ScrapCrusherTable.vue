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

function formatKg(value?: number | string | null) {
  return `${Number(value || 0).toFixed(2)} kg`
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
      h(UBadge, { color: 'error', variant: 'soft' }, () => `${row.original.qty_scrap || 0} PCS`)
  },
  {
    accessorKey: 'weight_per_pcs',
    header: 'Weight / PCS',
    cell: ({ row }) => formatKg(row.original.weight_per_pcs)
  },
  {
    accessorKey: 'total_weight',
    header: 'Total Weight',
    cell: ({ row }) =>
      h(UBadge, { color: 'warning', variant: 'soft' }, () => formatKg(row.original.total_weight))
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
        size: 'sm',
        icon: row.getIsExpanded() ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down',
        onClick: () => row.toggleExpanded()
      })
  }
]
</script>

<template>
  <UCard>
    <UTable v-model:expanded="expanded" :data="loading ? [] : data" :columns="columns" :loading="loading"
      class="w-full">
      <template #expanded="{ row }">
        <div class="px-4 pb-5">
          <div class="rounded-xl border border-default bg-elevated/40 p-5">
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <!-- Scrap Info -->
              <div class="min-w-0 space-y-4">
                <div class="flex items-center gap-2 border-b border-default pb-3">
                  <UIcon name="i-lucide-info" class="size-4 text-muted" />
                  <h4 class="text-sm font-semibold text-highlighted">Scrap Info</h4>
                </div>

                <div class="space-y-3 text-sm">
                  <div class="grid grid-cols-[140px_1fr] gap-2">
                    <span class="text-muted">Production Result ID</span>
                    <span class="font-medium text-highlighted">: {{ row.original.production_result_id || '-' }}</span>
                  </div>

                  <div class="grid grid-cols-[140px_1fr] gap-2">
                    <span class="text-muted">Replacement ID</span>
                    <span class="font-medium text-highlighted">: {{ row.original.replacement_id || '-' }}</span>
                  </div>

                  <div class="grid grid-cols-[140px_1fr] gap-2">
                    <span class="text-muted">Scrap Date</span>
                    <span class="font-medium text-highlighted">: {{ formatDate(row.original.scrap_date) }}</span>
                  </div>

                  <div class="grid grid-cols-[140px_1fr] gap-2">
                    <span class="text-muted">Created By</span>
                    <span class="break-all font-medium text-highlighted">
                      : {{ row.original.created_by_email || '-' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- NG Material -->
              <div class="min-w-0 space-y-4">
                <div class="flex items-center gap-2 border-b border-default pb-3">
                  <UIcon name="i-lucide-box" class="size-4 text-muted" />
                  <h4 class="text-sm font-semibold text-highlighted">NG Material</h4>
                </div>

                <div class="space-y-3 text-sm">
                  <div class="grid grid-cols-[90px_1fr] gap-2">
                    <span class="text-muted">Product</span>
                    <div class="min-w-0">
                      <p class="font-medium text-highlighted">
                        : {{ row.original.product_part_number || '-' }}
                      </p>
                      <p v-if="row.original.product_part_name" class="ml-2 mt-1 text-xs text-muted">
                        - {{ row.original.product_part_name }}
                      </p>
                    </div>
                  </div>

                  <div class="grid grid-cols-[90px_1fr] gap-2">
                    <span class="text-muted">Material</span>
                    <div class="min-w-0">
                      <p class="font-medium text-highlighted">
                        : {{ row.original.material_part_number || '-' }}
                      </p>
                      <p v-if="row.original.material_part_name" class="ml-2 mt-1 text-xs text-muted">
                        - {{ row.original.material_part_name }}
                      </p>
                    </div>
                  </div>

                  <div class="grid grid-cols-[90px_1fr] gap-2">
                    <span class="text-muted">NG Label</span>
                    <span class="break-all font-medium text-highlighted">
                      : {{ row.original.ng_source_label_number || '-' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Replacement Labels -->
              <div class="min-w-0 space-y-4">
                <div class="flex items-center gap-2 border-b border-default pb-3">
                  <UIcon name="i-lucide-tag" class="size-4 text-muted" />
                  <h4 class="text-sm font-semibold text-highlighted">Replacement Labels</h4>
                </div>

                <div v-if="row.original.replacement_labels?.length" class="max-h-40 space-y-2 overflow-y-auto pr-1">
                  <UBadge v-for="label in row.original.replacement_labels" :key="label.id" color="primary"
                    variant="soft" class="block w-fit max-w-full truncate">
                    {{ label.pcs_label_number }}
                  </UBadge>
                </div>

                <p v-else class="text-sm text-muted">
                  No replacement label found
                </p>
              </div>
            </div>

            <!-- Crusher pindah ke baris kedua -->
            <div class="mt-6 border-t border-default pt-5">
              <div class="mb-4 flex items-center gap-2">
                <UIcon name="i-lucide-settings" class="size-4 text-muted" />
                <h4 class="text-sm font-semibold text-highlighted">Crusher</h4>
              </div>

              <div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-lg border border-default bg-default/30 p-3">
                  <p class="text-xs text-muted">Qty Scrap</p>
                  <p class="mt-1 font-semibold text-highlighted">
                    {{ row.original.qty_scrap || 0 }} PCS
                  </p>
                </div>

                <div class="rounded-lg border border-default bg-default/30 p-3">
                  <p class="text-xs text-muted">Weight / PCS</p>
                  <p class="mt-1 font-semibold text-highlighted">
                    {{ formatKg(row.original.weight_per_pcs) }}
                  </p>
                </div>

                <div class="rounded-lg border border-default bg-default/30 p-3">
                  <p class="text-xs text-muted">Total Weight</p>
                  <p class="mt-1 font-semibold text-highlighted">
                    {{ formatKg(row.original.total_weight) }}
                  </p>
                </div>

                <div class="rounded-lg border border-default bg-default/30 p-3">
                  <p class="text-xs text-muted">Remarks</p>
                  <p class="mt-1 wrap-break-word font-semibold text-highlighted">
                    {{ row.original.remarks || '-' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UTable>

    <div v-if="!loading && !data.length" class="py-10 text-center text-muted">
      No scrap / crusher data found.
    </div>
  </UCard>
</template>