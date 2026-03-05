import { h } from 'vue'
import type { Parts } from '../../../../types/master-data/parts'
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
  onEdit: (part: Parts) => void
  onDelete: (part: Parts) => void
}

export function usePartColumns(actions: Actions, ui: UIComponents) {
  const getActionItems = (row: Row<Parts>) => [
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

  const columns: ColumnDef<Parts>[] = [
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
      accessorKey: 'part_number',
      header: 'Part Number',
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.part_number)
    },
    {
      accessorKey: 'part_name',
      header: 'Part Name',
      cell: ({ row }) => h('div', { class: 'truncate max-w-[200px]' }, row.original.part_name)
    },
    {
      accessorKey: 'part_type_code',
      header: 'Type',
      cell: ({ row }) => h('div', { class: 'text-muted' }, row.original.part_type_code ?? '-')
    },
    {
      accessorKey: 'part_category',
      header: 'Category',
      cell: ({ row }) => h('div', { class: 'text-muted' }, row.original.part_category ?? '-')
    },
    {
      accessorKey: 'supplier',
      header: 'Supplier',
      cell: ({ row }) => h('div', { class: 'text-muted' }, row.original.suppliers?.name ?? '-')
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => h('div', { class: 'text-muted' }, row.original.price?.toLocaleString('id-ID') ?? '-')
    },
    {
      accessorKey: 'uom',
      header: 'UOM',
      cell: ({ row }) => h('div', { class: 'text-muted' }, row.original.uom ?? '-')
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