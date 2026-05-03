<script setup lang="ts">
import { h, ref, resolveComponent } from 'vue'
import type { StockByPart, StockPartLabel } from '../../../../types/warehouse/stock-monitoring'

const props = defineProps<{
  parts: StockByPart[]
  labelsMap: Record<string, StockPartLabel[]>
  loading?: boolean
}>()

const emit = defineEmits<{
  expandPart: [partNumber: string]
}>()

const expanded = ref({})
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

const columns = [
  {
    id: 'expand',
    cell: ({ row }: any) =>
      h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        icon: row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right',
        onClick: () => {
          row.toggleExpanded()
          emit('expandPart', row.original.part_number)
        }
      })
  },
  {
    accessorKey: 'part_number',
    header: 'Part Number'
  },
  {
    accessorKey: 'part_name',
    header: 'Part Name'
  },
  {
    accessorKey: 'part_category',
    header: 'Category',
    cell: ({ row }: any) => row.original.part_category || '-'
  },
  {
    accessorKey: 'package_name',
    header: 'Package',
    cell: ({ row }: any) => row.original.package_name || row.original.package_code || '-'
  },
  {
    accessorKey: 'total_kanban',
    header: 'Kanban'
  },
  {
    accessorKey: 'total_pcs',
    header: 'PCS'
  },
  {
    accessorKey: 'total_bins',
    header: 'Bins'
  },
  {
    accessorKey: 'oldest_stock_at',
    header: 'Oldest Stock',
    cell: ({ row }: any) => formatDate(row.original.oldest_stock_at)
  }
]
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="font-semibold">
            Stock by Part
          </h3>
          <p class="text-xs text-muted">
            Expand row to see label details and FIFO order.
          </p>
        </div>

        <UBadge variant="soft" color="primary">
          {{ parts.length }} Part(s)
        </UBadge>
      </div>
    </template>

    <UTable
      v-model:expanded="expanded"
      :data="loading ? [] : props.parts"
      :columns="columns"
      :loading="loading"
      class="w-full"
    >
      <template #expanded="{ row }">
        <div class="p-4 bg-elevated/50 border-b border-default">
          <div class="mb-3">
            <h4 class="font-semibold text-sm">
              Label Detail - {{ row.original.part_number }}
            </h4>
            <p class="text-xs text-muted">
              Sorted by placement date ASC for FIFO.
            </p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-default text-left">
                  <th class="p-2">FIFO</th>
                  <th class="p-2">Label Number</th>
                  <th class="p-2">Bin</th>
                  <th class="p-2">Area</th>
                  <th class="p-2">Qty / Kanban</th>
                  <th class="p-2">Placement Date</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(label, index) in labelsMap[row.original.part_number] || []"
                  :key="label.stock_id"
                  class="border-b border-default"
                >
                  <td class="p-2">
                    <UBadge
                      size="sm"
                      variant="soft"
                      :color="index === 0 ? 'success' : 'neutral'"
                    >
                      #{{ index + 1 }}
                    </UBadge>
                  </td>
                  <td class="p-2">{{ label.label_number }}</td>
                  <td class="p-2">{{ label.bin_code }}</td>
                  <td class="p-2">{{ label.warehouse_area || '-' }}</td>
                  <td class="p-2">{{ label.qty_per_kanban }}</td>
                  <td class="p-2">{{ formatDate(label.placement_date) }}</td>
                </tr>

                <tr v-if="!(labelsMap[row.original.part_number] || []).length">
                  <td colspan="6" class="p-4 text-center text-muted">
                    Loading / no label details.
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