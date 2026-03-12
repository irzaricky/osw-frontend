import { h } from 'vue'
import type { Shift } from '../../../../types/master-data/shift'
import type { ColumnDef } from '@tanstack/table-core'

interface UIComponents {
  UCheckbox: any
  UButton: any
  UDropdownMenu: any
  UBadge: any
}

interface Actions {
  onEdit: (shift: Shift) => void
  onDelete: (shift: Shift) => void
}

export function useShiftColumns(actions: Actions, ui: UIComponents) {
  const columns: ColumnDef<Shift>[] = [
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
      header: 'No',
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.name),
    },
    {
      accessorKey: 'shift_number',
      header: 'Shift Number',
      cell: ({ row }) => h('div', { class: 'text-muted' }, row.original.shift_number),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => h(ui.UBadge, {
        label: row.original.type,
        color: row.original.type === 'REGULAR' ? 'info' : 'warning',
        variant: 'soft',
      }),
    },
    {
      accessorKey: 'start_time',
      header: 'Start',
      cell: ({ row }) => h('div', { class: 'font-mono text-sm text-muted' }, row.original.start_time?.slice(0, 5) ?? '-'),
    },
    {
      accessorKey: 'end_time',
      header: 'End',
      cell: ({ row }) => h('div', { class: 'font-mono text-sm text-muted' }, row.original.end_time?.slice(0, 5) ?? '-'),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => h(ui.UBadge, {
        label: row.original.category,
        color: row.original.category === 'PRODUCTIVE' ? 'success' : 'neutral',
        variant: 'soft',
      }),
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => h(ui.UBadge, {
        label: row.original.active ? 'Active' : 'Inactive',
        color: row.original.active ? 'success' : 'neutral',
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