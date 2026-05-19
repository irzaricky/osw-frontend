import { h } from 'vue'
import type { ProductionOrder, POStatus, POPriority } from '../../../../types/production-plan/order-schedule'
import type { ColumnDef } from '@tanstack/table-core'

interface UIComponents {
  UCheckbox:    any
  UButton:      any
  UDropdownMenu: any
  UBadge:       any
}

interface Actions {
  onView:   (order: ProductionOrder) => void
  onDelete: (order: ProductionOrder) => void
}

export const poStatusColor: Record<POStatus, 'neutral' | 'info' | 'warning' | 'success' | 'error'> = {
  Draft:       'neutral',
  Released:    'info',
  In_Progress: 'warning',
  Completed:   'success',
  Closed:      'neutral',
  Rejected:    'error',
  Cancelled:   'error',
}

export const poStatusLabel: Record<POStatus, string> = {
  Draft:       'Draft',
  Released:    'Released',
  In_Progress: 'In Progress',
  Completed:   'Completed',
  Closed:      'Closed',
  Rejected:    'Rejected',
  Cancelled:   'Cancelled',
}

export const priorityColor: Record<POPriority, 'neutral' | 'info' | 'warning' | 'error'> = {
  Low:      'neutral',
  Medium:   'info',
  High:     'warning',
  Critical: 'error',
}

export function useOrderScheduleColumns(actions: Actions, ui: UIComponents) {
  const columns: ColumnDef<ProductionOrder>[] = [
    {
      id: 'select',
      header: ({ table }) =>
        h(ui.UCheckbox, {
          modelValue: table.getIsAllPageRowsSelected(),
          indeterminate: table.getIsSomePageRowsSelected(),
          'onUpdate:modelValue': (v: boolean) => table.toggleAllPageRowsSelected(!!v),
          ariaLabel: 'Select all',
        }),
      cell: ({ row }) =>
        h(ui.UCheckbox, {
          modelValue: row.getIsSelected(),
          'onUpdate:modelValue': (v: boolean) => row.toggleSelected(!!v),
          ariaLabel: 'Select row',
        }),
      enableSorting: false,
      enableHiding:  false,
    },
    {
      header: 'No',
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: 'po_number',
      header: 'PO Number',
      cell: ({ row }) =>
        h(
          'button',
          {
            class: 'font-semibold text-primary hover:underline text-left',
            onClick: () => actions.onView(row.original),
          },
          row.original.po_number,
        ),
    },
    {
      id: 'plan',
      header: 'Plan',
      cell: ({ row }) =>
        h('div', { class: 'text-sm text-muted truncate max-w-36' },
          row.original.plan?.plan_number ?? '-'),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) =>
        h(ui.UBadge, {
          label:   row.original.priority,
          color:   priorityColor[row.original.priority],
          variant: 'soft',
        }),
    },
    {
      id: 'production_range',
      header: 'Production Range',
      cell: ({ row }) => {
        const fmt = (d: string) =>
          new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        return h('div', { class: 'text-sm whitespace-nowrap' }, [
          h('span', fmt(row.original.production_start_date)),
          h('span', { class: 'text-muted mx-1' }, '–'),
          h('span', fmt(row.original.production_end_date)),
        ])
      },
    },
    {
      id: 'qty_summary',
      header: 'Qty (Planned / Scheduled)',
      cell: ({ row }) => {
        const planned   = row.original.total_planned_qty
        const scheduled = row.original.total_scheduled_qty
        const isFull    = scheduled >= planned
        return h('div', { class: 'font-mono text-sm' }, [
          h('span', planned.toLocaleString()),
          h('span', { class: 'text-muted mx-1' }, '/'),
          h('span', { class: isFull ? 'text-success-500' : 'text-warning-500' },
            scheduled.toLocaleString()),
        ])
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) =>
        h(ui.UBadge, {
          label:   poStatusLabel[row.original.status],
          color:   poStatusColor[row.original.status],
          variant: 'subtle',
        }),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        h('div', { class: 'flex justify-end' }, [
          h(
            ui.UDropdownMenu,
            {
              items: [
                [
                  {
                    label:    'Detail & Edit',
                    icon:     'i-lucide-eye',
                    onSelect: () => actions.onView(row.original),
                  },
                ],
                [
                  {
                    label:    'Delete',
                    icon:     'i-lucide-trash-2',
                    color:    'error' as const,
                    onSelect: () => actions.onDelete(row.original),
                    disabled: row.original.status !== 'Draft',
                  },
                ],
              ],
              content: { align: 'end' },
            },
            () =>
              h(ui.UButton, {
                icon:    'i-lucide-more-vertical',
                color:   'neutral',
                variant: 'ghost',
                class:   'h-8 w-8 p-0',
              }),
          ),
        ]),
    },
  ]

  return { columns }
}