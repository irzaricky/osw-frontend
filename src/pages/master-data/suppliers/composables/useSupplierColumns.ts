import { h } from 'vue'
import type { Suppliers } from '../../../../types/master-data/suppliers'
import type { ColumnDef, Row } from '@tanstack/table-core'

interface UIComponents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  UCheckbox: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  UButton: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  UDropdownMenu: any
}

interface Actions {
  onEdit: (supplier: Suppliers) => void
  onDelete: (supplier: Suppliers) => void
}

export function useSupplierColumns(actions: Actions, ui: UIComponents) {
  const getActionItems = (row: Row<Suppliers>) => [
    [
      {
        label: 'Edit',
        icon: 'i-lucide-pencil',
        onSelect: () => actions.onEdit(row.original)
      },
      {
        label: 'Delete',
        icon: 'i-lucide-trash-2',
        color: 'error' as const,
        onSelect: () => actions.onDelete(row.original)
      }
    ]
  ]

  const columns: ColumnDef<Suppliers>[] = [
    {
      id: 'select',
      header: ({ table }) => h(ui.UCheckbox, {
        modelValue: table.getIsAllPageRowsSelected(),
        indeterminate: table.getIsSomePageRowsSelected(),
        'onUpdate:modelValue': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
        ariaLabel: 'Select all'
      }),
      cell: ({ row }) => h(ui.UCheckbox, {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean) => row.toggleSelected(!!value),
        ariaLabel: 'Select row'
      }),
      enableSorting: false,
      enableHiding: false
    },
    {
      header: 'No',
      cell: ({ row }) => row.index + 1
    },
    {
      accessorKey: 'supplier_code',
      header: 'Code',
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.supplier_code)
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => h('div', { class: 'truncate max-w-[200px]' }, row.original.name)
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => h('div', { class: 'text-muted' }, row.original.email ?? '-')
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => h('div', { class: 'text-muted truncate max-w-[200px]' }, row.original.notes ?? '-')
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        return h('div', { class: 'flex justify-end' }, [
          h(ui.UDropdownMenu, {
            items: getActionItems(row),
            content: { align: 'end' }
          }, () => h(ui.UButton, {
            icon: 'i-lucide-more-vertical',
            color: 'neutral',
            variant: 'ghost',
            class: 'h-8 w-8 p-0'
          }))
        ])
      }
    }
  ]

  return { columns }
}