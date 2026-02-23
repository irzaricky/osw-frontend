import { h, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Dock } from '../../../../types/master-data/dock'

interface ColumnActions {
  onEdit: (warehouse: Dock) => void
  onDelete: (warehouse: Dock) => void
}

interface ColumnComponents {
  UCheckbox: Component | string
  UBadge: Component | string
  UButton: Component | string
  UDropdownMenu: Component | string
}

export function useDockColumns(actions: ColumnActions, components: ColumnComponents) {
  const { UCheckbox, UButton, UDropdownMenu } = components

  const columns: TableColumn<Dock>[] = [
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
    {
      header: 'No',
      cell: ({ row }) => row.index + 1
    },
    {
      accessorKey: 'dock_code',
      header: 'Dock Code'
    },
    {
      accessorKey: 'name',
      header: 'Dock Name'
    },
    {
      accessorKey: 'area.name',
      header: 'Area',
      cell: ({ row }) => row.original.area?.name || '-'
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const dock = row.original

        const items = [
          [
            {
              label: 'Edit',
              icon: 'i-lucide-edit',
              onSelect: () => actions.onEdit(dock)
            }
          ],
          [
            {
              label: 'Delete',
              icon: 'i-lucide-trash-2',
              color: 'error' as const,
              onSelect: () => actions.onDelete(dock)
            }
          ]
        ]

        return h(UDropdownMenu, {
          items
        }, {
          default: () => h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            icon: 'i-lucide-more-vertical'
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