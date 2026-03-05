import { h, Ref, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Defect } from '../../../../types/master-data/defect'

interface ColumnActions {
  onEdit: (defect: Defect) => void
  onDelete: (defect: Defect) => void
}

interface ColumnComponents {
  UCheckbox: Component | string
  UButton: Component | string
  UDropdownMenu: Component | string
}

export function useDefectColumns(actions: ColumnActions, components: ColumnComponents, pagination: Ref<{ page: number; limit: number }>) {
  const { UCheckbox, UButton, UDropdownMenu } = components

  const columns: TableColumn<Defect>[] = [
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
      accessorKey: 'name',
      header: 'Defect Name'
    },
    {
      accessorKey: 'defect.name',
      header: 'Defect Category',
      cell: ({ row }) => row.original.category?.name || '-'
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const defect = row.original
        
        const items = [
          [
            {
              label: 'Edit',
              icon: 'i-lucide-edit',
              onSelect: () => actions.onEdit(defect)
            }
          ],
          [
            {
              label: 'Delete',
              icon: 'i-lucide-trash-2',
              color: 'error' as const,
              onSelect: () => actions.onDelete(defect)
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