import { h, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { WarehouseArea } from '../../../../types'

interface ColumnActions {
  onEdit: (area: WarehouseArea) => void
  onDelete: (area: WarehouseArea) => void
  onPrint: (area: WarehouseArea) => void
}

interface ColumnComponents {
  UCheckbox: Component | string
  UBadge: Component | string
  UButton: Component | string
  UDropdownMenu: Component | string
}

export function useWarehouseAreaColumns(
  actions: ColumnActions,
  components: ColumnComponents
) {
  const { UCheckbox, UBadge, UButton, UDropdownMenu } = components

  const columns: TableColumn<WarehouseArea>[] = [
    //  SELECT CHECKBOX
    {
      id: 'select',
      header: ({ table }) =>
        h(UCheckbox, {
          modelValue: table.getIsSomePageRowsSelected()
            ? 'indeterminate'
            : table.getIsAllPageRowsSelected(),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
            table.toggleAllPageRowsSelected(!!value),
          ariaLabel: 'Select all'
        }),
      cell: ({ row }) =>
        h(UCheckbox, {
          modelValue: row.getIsSelected(),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
            row.toggleSelected(!!value),
          ariaLabel: 'Select row'
        })
    },

    //  NO
    {
      header: 'No',
      cell: ({ row }) => row.index + 1
    },

    //  WAREHOUSE
    {
      accessorKey: 'warehouse.name',
      header: 'Warehouse',
      cell: ({ row }) => row.original.warehouse?.name || '-'
    },

    //  AREA CODE
    {
      accessorKey: 'area_code',
      header: 'Area Code'
    },

    //  NAME
    {
      accessorKey: 'name',
      header: 'Area Name'
    },

    //  COLS
    {
      accessorKey: 'total_cols',
      header: 'Cols',
      cell: ({ row }) =>
        h(
          UBadge,
          { color: 'neutral', variant: 'subtle' },
          () => String(row.original.total_cols ?? '-')
        )
    },

    //  ROWS
    {
      accessorKey: 'total_rows',
      header: 'Rows',
      cell: ({ row }) =>
        h(
          UBadge,
          { color: 'neutral', variant: 'subtle' },
          () => String(row.original.total_rows ?? '-')
        )
    },

    //  TOTAL BIN (optional: cols * rows)
    {
      id: 'total_bin',
      header: 'Total Bin',
      cell: ({ row }) => {
        const c = Number(row.original.total_cols ?? 0)
        const r = Number(row.original.total_rows ?? 0)
        return c && r ? c * r : '-'
      }
    },

    //  ACTIONS
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const area = row.original

        const items = [
          [
            {
              label: 'Edit',
              icon: 'i-lucide-edit',
              onSelect: () => actions.onEdit(area)
            },
            {
              label: 'Print',
              icon: 'i-lucide-printer',
              onSelect: () => actions.onPrint(area)
            }
          ],
          [
            {
              label: 'Delete',
              icon: 'i-lucide-trash-2',
              color: 'error' as const,
              onSelect: () => actions.onDelete(area)
            }
          ]
        ]

        return h(
          UDropdownMenu,
          { items },
          {
            default: () =>
              h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                icon: 'i-lucide-ellipsis-vertical'
              })
          }
        )
      }
    },

    //  EXPAND
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