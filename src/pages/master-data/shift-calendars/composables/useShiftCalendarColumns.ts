import { h } from 'vue'
import type { ShiftCalendar } from '../../../../types/master-data/shift-calendar'
import type { ColumnDef } from '@tanstack/table-core'

interface UIComponents {
  UCheckbox: any
  UButton: any
  UDropdownMenu: any
  UBadge: any
}

interface Actions {
  onEdit: (sc: ShiftCalendar) => void
  onDelete: (sc: ShiftCalendar) => void
}

export function useShiftCalendarColumns(actions: Actions, ui: UIComponents) {
  const columns: ColumnDef<ShiftCalendar>[] = [
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
      accessorKey: 'shift',
      header: 'Shift',
      cell: ({ row }) => h('div', { class: 'font-medium' },
        row.original.shift ? `${row.original.shift.name} (${row.original.shift.shift_number})` : '-'
      ),
    },
    {
      accessorKey: 'line',
      header: 'Line',
      cell: ({ row }) => h('div', { class: 'text-muted' }, row.original.line?.name ?? '-'),
    },
    {
      accessorKey: 'calendar_type',
      header: 'Calendar Type',
      cell: ({ row }) => h('div', { class: 'text-muted' }, row.original.type_calendar?.name ?? '-'),
    },
    {
      accessorKey: 'date_event',
      header: 'Event',
      cell: ({ row }) => h('div', { class: 'truncate max-w-[180px]' }, row.original.date_event),
    },
    {
      accessorKey: 'start_date',
      header: 'Start Date',
      cell: ({ row }) => h('div', { class: 'font-mono text-sm text-muted' }, row.original.start_date),
    },
    {
      accessorKey: 'end_date',
      header: 'End Date',
      cell: ({ row }) => h('div', { class: 'font-mono text-sm text-muted' }, row.original.end_date),
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