<script setup lang="ts">
import { h, ref, resolveComponent } from 'vue'
import type { StockByBin, StockBinItem } from '../../../../types/warehouse/stock-monitoring'

const props = defineProps<{
  bins: StockByBin[]
  stocksMap: Record<string, StockBinItem[]>
  loading?: boolean
}>()

const emit = defineEmits<{
  expandBin: [binId: number]
}>()

const expanded = ref({})
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function getStatusColor(status?: string) {
  if (status === 'Full') return 'error'
  if (status === 'Unconfigured') return 'warning'
  if (status === 'Free') return 'neutral'
  return 'success'
}

const columns = [

  {
    accessorKey: 'bin_code',
    header: 'Bin Code'
  },
  {
    accessorKey: 'warehouse_area',
    header: 'Area',
    cell: ({ row }: any) => row.original.warehouse_area || '-'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }: any) =>
      h(
        UBadge,
        {
          color: getStatusColor(row.original.status),
          variant: 'soft'
        },
        () => row.original.status
      )
  },
  {
    id: 'restriction',
    header: 'Restriction',
    cell: ({ row }: any) => {
      const bin = row.original

      if (bin.is_dedicated && bin.dedicated_part_number) {
        return `Dedicated: ${bin.dedicated_part_number}`
      }

      if (bin.allowed_part_category) {
        return `${bin.allowed_part_category} Only`
      }

      return 'Free Bin'
    }
  },
  {
    accessorKey: 'capacity',
    header: 'Safe Capacity'
  },
  {
    accessorKey: 'used_capacity',
    header: 'Used'
  },
  {
    accessorKey: 'remaining_capacity',
    header: 'Remaining'
  },
  {
    accessorKey: 'total_part_variant',
    header: 'Part Variants'
  },
  {
    accessorKey: 'total_pcs',
    header: 'PCS'
  },
  {
    id: 'expand',
    cell: ({ row }: any) =>
      h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        icon: row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right',
        onClick: () => {
          row.toggleExpanded()
          emit('expandBin', row.original.bin_id)
        }
      })
  },
]
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="font-semibold">
            Stock by Storage Bin
          </h3>
          <p class="text-xs text-muted">
            Expand row to see stock content inside bin.
          </p>
        </div>

        <UBadge variant="soft" color="primary">
          {{ bins.length }} Bin(s)
        </UBadge>
      </div>
    </template>

    <UTable v-model:expanded="expanded" :data="loading ? [] : props.bins" :columns="columns" :loading="loading"
      class="w-full">
      <template #expanded="{ row }">
        <div class="p-4 bg-elevated/50 border-b border-default">
          <div class="mb-3">
            <h4 class="font-semibold text-sm">
              Bin Content - {{ row.original.bin_code }}
            </h4>
            <p class="text-xs text-muted">
              Shows all active stock labels currently stored in this bin.
            </p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-default text-left">
                  <th class="p-2">FIFO</th>
                  <th class="p-2">Part Number</th>
                  <th class="p-2">Part Name</th>
                  <th class="p-2">Label Number</th>
                  <th class="p-2">Placed By</th>
                  <th class="p-2">Qty / Kanban</th>
                  <th class="p-2">Placement Date</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(stock, index) in stocksMap[String(row.original.bin_id)] || []" :key="stock.stock_id"
                  class="border-b border-default">
                  <td class="p-2">
                    <UBadge size="sm" variant="soft" :color="index === 0 ? 'success' : 'neutral'">
                      #{{ index + 1 }}
                    </UBadge>
                  </td>
                  <td class="p-2">{{ stock.part_number }}</td>
                  <td class="p-2">{{ stock.part_name }}</td>
                  <td class="p-2">{{ stock.label_number }}</td>
                  <td class="p-2">{{ stock.placed_by || '-' }}</td>
                  <td class="p-2">{{ stock.qty_per_kanban }}</td>
                  <td class="p-2">{{ formatDate(stock.placement_date) }}</td>
                </tr>

                <tr v-if="!(stocksMap[String(row.original.bin_id)] || []).length">
                  <td colspan="6" class="p-4 text-center text-muted">
                    Loading / no stock in this bin.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </UTable>
  </UCard>
</template>