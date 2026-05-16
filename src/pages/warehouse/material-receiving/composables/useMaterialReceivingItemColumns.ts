import { h, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { MaterialReceivingItem } from '../../../../types/warehouse/material-receiving'

interface ColumnActions {
  onPrintLabel: (item: MaterialReceivingItem) => void
}

interface ColumnComponents {
  UButton: Component | string
}

export function useMaterialReceivingItemColumns(
  isArrived: boolean,
  actions: ColumnActions,
  components: ColumnComponents
) {
  const { UButton } = components

  const columns: TableColumn<MaterialReceivingItem>[] = [
    {
      header: 'No',
      cell: ({ row }) => row.index + 1
    },
    {
      accessorKey: 'part.part_number',
      header: 'Part Number',
      cell: ({ row }) => row.original.part?.part_number || '-'
    },
    {
      accessorKey: 'part.part_name',
      header: 'Part Name',
      cell: ({ row }) => row.original.part?.part_name || '-'
    },
    {
      accessorKey: 'qty',
      header: 'Quantity',
      cell: ({ row }) => row.original.qty || '0'
    }
  ]

  if (isArrived) {
    columns.push({
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        h(UButton, {
          label: 'Print Label',
          color: 'primary',
          variant: 'subtle',
          icon: 'i-lucide-printer',
          onClick: () => actions.onPrintLabel(row.original)
        })
    })
  }

  return { columns }
}