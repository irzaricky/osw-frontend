import { h } from 'vue'
import type { ProductionOrder } from '../../../../types/production-plan/order-schedule'
import type { ColumnDef } from '@tanstack/table-core'
import { poStatusLabel, poStatusColor, priorityColor, fmtDate, fmtNum } from './usePOUtils'

interface UIComponents {
  UCheckbox:     any
  UButton:       any
  UDropdownMenu: any
  UBadge:        any
}

interface Actions {
  onView:   (order: ProductionOrder) => void
  onDelete: (order: ProductionOrder) => void
}

export function useOrderScheduleColumns(actions: Actions, ui: UIComponents) {
  const columns: ColumnDef<ProductionOrder>[] = [
    {
      header: '#',
      cell:   ({ row }) => h('span', { class: 'text-muted text-xs' }, row.index + 1),
    },
    {
      accessorKey: 'po_number',
      header:      'PO Number',
      cell: ({ row }) =>
        h('button', {
          class:   'font-semibold text-primary hover:underline text-left font-mono text-sm',
          onClick: () => actions.onView(row.original),
        }, row.original.po_number),
    },
    {
      id:     'plan',
      header: 'Plan',
      cell:   ({ row }) =>
        h('span', { class: 'text-sm text-muted font-mono' },
          row.original.plan?.plan_number ?? '-'),
    },
    {
      accessorKey: 'priority',
      header:      'Priority',
      cell:        ({ row }) =>
        h(ui.UBadge, {
          label:   row.original.priority,
          color:   priorityColor[row.original.priority],
          variant: 'soft',
          size:    'sm',
        }),
    },
    {
      id:     'production_range',
      header: 'Production Range',
      cell:   ({ row }) =>
        h('div', { class: 'text-sm whitespace-nowrap font-mono' }, [
          h('span', fmtDate(row.original.production_start_date)),
          h('span', { class: 'text-muted mx-1' }, '–'),
          h('span', fmtDate(row.original.production_end_date)),
        ]),
    },
    {
      id:     'qty_summary',
      header: 'Planned / Scheduled',
      cell:   ({ row }) => {
        const planned   = row.original.total_planned_qty
        const scheduled = row.original.total_scheduled_qty
        const isFull    = scheduled >= planned
        return h('div', { class: 'font-mono text-sm' }, [
          h('span', fmtNum(planned)),
          h('span', { class: 'text-muted mx-1' }, '/'),
          h('span', { class: isFull ? 'text-success-500' : 'text-warning-500' }, fmtNum(scheduled)),
        ])
      },
    },
    {
      accessorKey: 'status',
      header:      'Status',
      cell:        ({ row }) =>
        h(ui.UBadge, {
          label:   poStatusLabel[row.original.status],
          color:   poStatusColor[row.original.status],
          variant: 'subtle',
          size:    'sm',
        }),
    },
    {
      id:     'actions',
      header: '',
      cell:   ({ row }) =>
        h('div', { class: 'flex justify-end' }, [
          h(ui.UDropdownMenu, {
            items: [
              [{ label: 'View Detail', icon: 'i-lucide-eye', onSelect: () => actions.onView(row.original) }],
              [{
                label:    'Delete',
                icon:     'i-lucide-trash-2',
                color:    'error' as const,
                onSelect: () => actions.onDelete(row.original),
                disabled: row.original.status !== 'Draft',
              }],
            ],
            content: { align: 'end' },
          },
          () => h(ui.UButton, {
            icon:    'i-lucide-ellipsis-vertical',
            color:   'neutral',
            variant: 'ghost',
            class:   'h-8 w-8 p-0',
          })),
        ]),
    },
  ]

  return { columns }
}