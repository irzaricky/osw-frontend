import { h, type Ref, computed } from 'vue'
import type { ColumnDef }        from '@tanstack/table-core'
import type { WorkOrder, WorkOrderStatus } from '../../../../types/production-plan/work-order'

interface UIComponents {
  UCheckbox:     any
  UButton:       any
  UDropdownMenu: any
  UBadge:        any
}

interface Actions {
  onView:  (wo: WorkOrder) => void
  onStart: (wo: WorkOrder) => void
}

export const WO_STATUS_COLOR: Record<WorkOrderStatus, 'neutral' | 'info' | 'warning' | 'success' | 'error'> = {
  Released:    'info',
  In_Progress: 'warning',
  Completed:   'success',
  Cancelled:   'error',
}

export const WO_STATUS_LABEL: Record<WorkOrderStatus, string> = {
  Released:    'Released',
  In_Progress: 'In Progress',
  Completed:   'Completed',
  Cancelled:   'Cancelled',
}

export function useWorkOrderColumns(
  actions:    Actions,
  ui:         UIComponents,
  pagination: Ref<{ page: number; limit: number }>,
) {
  const columns: ColumnDef<WorkOrder>[] = [
    {
      header: '#',
      // Correct row number across pages
      cell:   ({ row }) => (pagination.value.page - 1) * pagination.value.limit + row.index + 1,
    },
    {
      accessorKey: 'wo_number',
      header:      'WO Number',
      cell:        ({ row }) =>
        h('button', {
          class:   'font-semibold text-primary hover:underline text-left font-mono',
          onClick: () => actions.onView(row.original),
        }, row.original.wo_number),
    },
    {
      id:     'production_order',
      header: 'PO Number',
      cell:   ({ row }) =>
        h('span', { class: 'text-sm font-mono text-muted' }, row.original.production_order?.po_number ?? '-'),
    },
    {
      id:     'part',
      header: 'Part',
      cell:   ({ row }) =>
        h('div', [
          h('div', { class: 'font-medium text-sm' }, row.original.part?.part_name ?? '-'),
          h('div', { class: 'text-xs text-muted font-mono' }, row.original.part?.part_number ?? ''),
        ]),
    },
    {
      id:     'line',
      header: 'Line',
      cell:   ({ row }) =>
        h('span', { class: 'text-sm' }, row.original.line?.name ?? '-'),
    },
    {
      accessorKey: 'work_date',
      header:      'Work Date',
      cell:        ({ row }) =>
        h('span', { class: 'text-sm' }, fmtDate(row.original.work_date)),
    },
    {
      id:     'qty',
      header: 'Qty (Plan / Actual)',
      cell:   ({ row }) => {
        const planned = row.original.planned_quantity
        const actual  = row.original.cumulative_qty_good ?? row.original.actual_quantity
        const pct     = planned > 0 ? Math.round((actual / planned) * 100) : 0
        return h('div', { class: 'font-mono text-sm' }, [
          h('span', planned.toLocaleString()),
          h('span', { class: 'text-muted mx-1' }, '/'),
          h('span', { class: actual >= planned ? 'text-success-600' : 'text-warning-600' }, actual.toLocaleString()),
          h('span', { class: 'text-xs text-muted ml-1.5' }, `${pct}%`),
        ])
      },
    },
    {
      accessorKey: 'status',
      header:      'Status',
      cell:        ({ row }) =>
        h(ui.UBadge, {
          label:   WO_STATUS_LABEL[row.original.status],
          color:   WO_STATUS_COLOR[row.original.status],
          variant: 'subtle',
        }),
    },
    {
      id:     'actions',
      header: '',
      cell:   ({ row }) => {
        const wo = row.original
        const menuItems = [
          [
            {
              label:    'View Detail',
              icon:     'i-lucide-eye',
              onSelect: () => actions.onView(wo),
            },
          ],
          [
            {
              label:    'Start WO',
              icon:     'i-lucide-play',
              onSelect: () => actions.onStart(wo),
              disabled: wo.status !== 'Released',
            },
          ],
        ]

        return h('div', { class: 'flex justify-end' }, [
          h(ui.UDropdownMenu, {
            items:   menuItems,
            content: { align: 'end' },
          }, () =>
            h(ui.UButton, {
              icon:    'i-lucide-ellipsis-vertical',
              color:   'neutral',
              variant: 'ghost',
              class:   'h-8 w-8 p-0',
            }),
          ),
        ])
      },
    },
  ]

  return { columns }
}

function fmtDate(d?: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}