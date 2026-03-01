import { h } from 'vue'
import type { Station } from '../../../../types/master-data/station'
import type { ColumnDef } from '@tanstack/table-core'

interface UIComponents {
  UCheckbox: any
  UButton: any
  UDropdownMenu: any
  UBadge: any
}

interface Actions {
  onEdit: (station: Station) => void
  onDelete: (station: Station) => void
}

export function useStationColumns(actions: Actions, ui: UIComponents) {
  const columns: ColumnDef<Station>[] = [
    {
      id: 'select',
      header: ({ table }) => h(ui.UCheckbox, {
        modelValue: table.getIsAllPageRowsSelected(),
        indeterminate: table.getIsSomePageRowsSelected(),
        'onUpdate:modelValue': (v: boolean) => table.toggleAllPageRowsSelected(!!v),
        ariaLabel: 'Select all',
      }),
      cell: ({ row }) => h(ui.UCheckbox, {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (v: boolean) => row.toggleSelected(!!v),
        ariaLabel: 'Select row',
      }),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'expander',
      header: '',
      cell: ({ row }) => h(ui.UButton, {
        icon: row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right',
        color: 'neutral',
        variant: 'ghost',
        class: 'h-8 w-8 p-0',
        onClick: () => row.toggleExpanded(),
      }),
      enableSorting: false,
    },
    {
      header: 'No',
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: 'station_code',
      header: 'Code',
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.station_code),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => h('div', { class: 'truncate max-w-[180px]' }, row.original.name),
    },
    {
      accessorKey: 'line',
      header: 'Line',
      cell: ({ row }) => h('div', { class: 'text-muted' }, row.original.line?.name ?? '-'),
    },
    {
      accessorKey: 'station_type',
      header: 'Type',
      cell: ({ row }) => h('div', { class: 'text-muted' }, row.original.station_type?.name ?? '-'),
    },
    {
      accessorKey: 'sequence',
      header: 'Seq',
      cell: ({ row }) => h('div', { class: 'text-center text-muted' }, row.original.sequence),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => h(ui.UBadge, {
        label: row.original.status ? 'Active' : 'Inactive',
        color: row.original.status ? 'success' : 'neutral',
        variant: 'soft',
      }),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => h('div', { class: 'flex justify-end' }, [
        h(ui.UDropdownMenu, {
          items: [[
            { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => actions.onEdit(row.original) },
            { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => actions.onDelete(row.original) },
          ]],
          content: { align: 'end' },
        }, () => h(ui.UButton, {
          icon: 'i-lucide-more-vertical',
          color: 'neutral',
          variant: 'ghost',
          class: 'h-8 w-8 p-0',
        })),
      ]),
    },
  ]

  return { columns }
}