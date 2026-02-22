import { h, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { WarehouseArea } from '../../../../types'

interface ColumnActions {
  onEdit: (area: WarehouseArea) => void
  onDelete: (area: WarehouseArea) => void
  onPrint: (area: WarehouseArea) => void
  onPrintBinLabels: (area: WarehouseArea) => void 
}

interface ColumnComponents {
  UCheckbox: Component | string
  UBadge: Component | string
  UButton: Component | string
  UDropdownMenu: Component | string
}

export function useWarehouseAreaColumns(actions: ColumnActions, components: ColumnComponents) {
  const { UCheckbox, UBadge, UButton, UDropdownMenu } = components

  const columns: TableColumn<WarehouseArea>[] = [
    {
      id: 'select',
      header: ({ table }) =>
        h(UCheckbox, {
          modelValue: table.getIsSomePageRowsSelected()
            ? 'indeterminate'
            : table.getIsAllPageRowsSelected(),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
            table.toggleAllPageRowsSelected(!!value),
          'ariaLabel': 'Select all'
        }),
      cell: ({ row }) =>
        h(UCheckbox, {
          modelValue: row.getIsSelected(),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
            row.toggleSelected(!!value),
          'ariaLabel': 'Select row'
        })
    },
    { header: 'No', cell: ({ row }) => row.index + 1 },
    { accessorKey: 'warehouse.name', header: 'Warehouse' },
    { accessorKey: 'area_code', header: 'Area Code' },
    { accessorKey: 'name', header: 'Area Name' },
    {
      header: 'Cols',
      cell: ({ row }) => h(UBadge, { color: 'neutral', variant: 'subtle' }, () => String(row.original.total_cols ?? 0))
    },
    {
      header: 'Rows',
      cell: ({ row }) => h(UBadge, { color: 'neutral', variant: 'subtle' }, () => String(row.original.total_rows ?? 0))
    },
    {
      header: 'Total Bin',
      cell: ({ row }) => String((row.original.total_cols ?? 0) * (row.original.total_rows ?? 0))
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const area = row.original

        const items = [
          [
            { label: 'Edit', icon: 'i-lucide-edit', onSelect: () => actions.onEdit(area) }
          ],
          [
            { label: 'Print Bin Labels', icon: 'i-lucide-qr-code', onSelect: () => actions.onPrintBinLabels(area) } 
          ],
          [
            { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => actions.onDelete(area) }
          ]
        ]

        return h(UDropdownMenu, { items }, {
          default: () =>
            h(UButton, {
              color: 'neutral',
              variant: 'ghost',
              icon: 'i-lucide-ellipsis-vertical'
            })
        })
      }
    },
    {
      id: 'expand',
      header: '',
      cell: ({ row }) =>
        h(UButton, {
          color: 'neutral',
          variant: 'ghost',
          icon: row.getIsExpanded()
            ? 'i-lucide-chevron-down'
            : 'i-lucide-chevron-right',
          size: 'xs',
          onClick: () => row.toggleExpanded()
        })
    }
  ]

  return { columns }
}