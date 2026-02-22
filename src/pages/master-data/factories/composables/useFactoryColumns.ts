import { h } from 'vue'
import type { Factory } from '../../../../types/master-data/factory'
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
  onEdit: (factory: Factory) => void
  onDelete: (factory: Factory) => void
}

export function useFactoryColumns(actions: Actions, ui: UIComponents) {
  const getActionItems = (row: Row<Factory>) => [
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

  const columns: ColumnDef<Factory>[] = [
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
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => h('div', { class: 'font-medium truncate max-w-[200px]' }, row.original.name)
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => h('div', { class: 'text-muted' }, row.original.phone ?? '-')
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => h('div', { class: 'truncate max-w-[250px] text-muted' }, row.original.address ?? '-')
    },
    {
      accessorKey: 'maps_url',
      header: 'Maps',
      cell: ({ row }) => row.original.maps_url
        ? h('a', {
            href: row.original.maps_url,
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'text-primary underline text-sm'
          }, 'View')
        : h('span', { class: 'text-muted' }, '-')
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