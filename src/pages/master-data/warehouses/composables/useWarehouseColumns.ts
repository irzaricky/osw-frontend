import { h, Ref, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Warehouse } from '../../../../types'

interface ColumnActions {
  onEdit: (warehouse: Warehouse) => void
  onDelete: (warehouse: Warehouse) => void
}

interface ColumnComponents {
  UCheckbox: Component | string
  UBadge: Component | string
  UButton: Component | string
  UDropdownMenu: Component | string
}

function getCategoryColor(categoryId?: number): string {
  if (!categoryId) return 'neutral'
  
  const colors: Record<number, string> = {
    1: 'secondary',
    2: 'warning',
    3: 'primary'
  }

  return colors[categoryId] || 'neutral'
}

export function useWarehouseColumns(actions: ColumnActions, components: ColumnComponents, pagination: Ref<{ page: number; limit: number }>) {
  const { UCheckbox, UBadge, UButton, UDropdownMenu } = components

  const columns: TableColumn<Warehouse>[] = [
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
      cell: ({ row }) => (pagination.value.page - 1) * pagination.value.limit + row.index + 1
    },
    {
      accessorKey: 'warehouse_code',
      header: 'Warehouse Code'
    },
    {
      accessorKey: 'name',
      header: 'Warehouse Name'
    },
    {
      accessorKey: 'category.name',
      header: 'Category',
      cell: ({ row }) =>
        h(
          UBadge,
          { color: getCategoryColor(row.original.category?.id), variant: 'subtle' },
          () => row.original.category?.name || '-'
        )
    },
    {
      accessorKey: 'line.name',
      header: 'Line',
      cell: ({ row }) => row.original.line?.name || '-'
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const warehouse = row.original

        const items = [
          [
            {
              label: 'Edit',
              icon: 'i-lucide-edit',
              onSelect: () => actions.onEdit(warehouse)
            }
          ],
          [
            {
              label: 'Delete',
              icon: 'i-lucide-trash-2',
              color: 'error' as const,
              onSelect: () => actions.onDelete(warehouse)
            }
          ]
        ]

        return h(UDropdownMenu, { 
          items
        }, {
          default: () => h(UButton, {
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