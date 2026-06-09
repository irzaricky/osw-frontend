import { h } from 'vue'
import type { ProductionPlan, PlanStatus, OverallStatus, PlanType } from '../../../../types/production-plan/plan'
import type { ColumnDef } from '@tanstack/table-core'

interface UIComponents {
  UCheckbox: any
  UButton: any
  UDropdownMenu: any
  UBadge: any
}

interface Actions {
  onView: (plan: ProductionPlan) => void
  onDelete: (plan: ProductionPlan) => void
}

const planStatusColor: Record<PlanStatus, 'neutral' | 'info' | 'warning' | 'success' | 'error'> = {
  Draft: 'neutral',
  Pending_Approval: 'warning',
  Approved: 'success',
  Rejected: 'error',
}

const planStatusLabel: Record<PlanStatus, string> = {
  Draft: 'Draft',
  Pending_Approval: 'Pending Approval',
  Approved: 'Approved',
  Rejected: 'Rejected',
}

const overallStatusColor: Record<OverallStatus, 'neutral' | 'success' | 'error'> = {
  Not_Calculated: 'neutral',
  POSSIBLE: 'success',
  IMPOSSIBLE: 'error',
}

const overallStatusLabel: Record<OverallStatus, string> = {
  Not_Calculated: 'Not Calculated',
  POSSIBLE: 'Possible',
  IMPOSSIBLE: 'Impossible',
}

// [+] Label & warna untuk plan_type
const planTypeLabel: Record<PlanType, string> = {
  ORIGINAL:  'Original',
  AMENDMENT: 'Amendment',
}

const planTypeColor: Record<PlanType, 'neutral' | 'info' | 'warning'> = {
  ORIGINAL:  'neutral',
  AMENDMENT: 'warning',
}

// Format YYYY-MM menjadi label yang lebih mudah dibaca, misal "2025-05" → "May 2025"
function fmtPlanMonth(plan_month: string): string {
  const [year, month] = plan_month.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function useProductionPlanColumns(actions: Actions, ui: UIComponents) {
  const columns: ColumnDef<ProductionPlan>[] = [
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
      enableHiding: false,
    },
    {
      header: 'No',
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: 'plan_number',
      header: 'Plan Number',
      cell: ({ row }) =>
        h(
          'button',
          {
            class: 'font-semibold text-primary hover:underline text-left',
            onClick: () => actions.onView(row.original),
          },
          row.original.plan_number,
        ),
    },
    // Kolom Plan Month — tampil setelah Plan Number
    {
      accessorKey: 'plan_month',
      header: 'Plan Month',
      cell: ({ row }) =>
        h('div', { class: 'text-sm font-mono' }, fmtPlanMonth(row.original.plan_month)),
    },
    // [+] Kolom Plan Type — ORIGINAL | AMENDMENT
    {
      accessorKey: 'plan_type',
      header: 'Type',
      cell: ({ row }) => {
        const type = (row.original.plan_type ?? 'ORIGINAL') as PlanType
        return h('div', { class: 'flex flex-col gap-0.5' }, [
          h(ui.UBadge, {
            label:   planTypeLabel[type] ?? type,
            color:   planTypeColor[type] ?? 'neutral',
            variant: 'soft',
            size:    'sm',
          }),
          // Tampilkan plan_number parent jika AMENDMENT
          row.original.plan_type === 'AMENDMENT' && row.original.parent_plan
            ? h('span', { class: 'text-xs text-muted font-mono' }, `↳ ${row.original.parent_plan.plan_number}`)
            : null,
        ])
      },
    },
    {
      accessorKey: 'plan_description',
      header: 'Description',
      cell: ({ row }) =>
        h('div', { class: 'text-sm text-muted max-w-48 truncate' }, row.original.plan_description || '-'),
    },
    {
      id: 'delivery_range',
      header: 'Delivery Range',
      cell: ({ row }) => {
        const earliest = row.original.earliest_delivery_date
        const latest = row.original.latest_delivery_date
        if (!earliest && !latest) return h('span', { class: 'text-muted' }, '-')
        const fmt = (d?: string | null) =>
          d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '?'
        return h('div', { class: 'text-sm' }, [
          h('span', fmt(earliest)),
          h('span', { class: 'text-muted mx-1' }, '–'),
          h('span', fmt(latest)),
        ])
      },
    },
    {
      id: 'qty_summary',
      header: 'Qty (Req / Cap)',
      cell: ({ row }) =>
        h('div', { class: 'font-mono text-sm' }, [
          h('span', row.original.total_qty_request.toLocaleString()),
          h('span', { class: 'text-muted mx-1' }, '/'),
          h('span', { class: row.original.total_qty_capacity >= row.original.total_qty_request ? 'text-success-500' : 'text-error-500' },
            row.original.total_qty_capacity.toLocaleString()),
        ]),
    },
    {
      accessorKey: 'overall_status',
      header: 'Capacity',
      cell: ({ row }) =>
        h(ui.UBadge, {
          label: overallStatusLabel[row.original.overall_status],
          color: overallStatusColor[row.original.overall_status],
          variant: 'soft',
        }),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) =>
        h(ui.UBadge, {
          label: planStatusLabel[row.original.status],
          color: planStatusColor[row.original.status],
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
                  { label: 'Detail & Edit', icon: 'i-lucide-eye', onSelect: () => actions.onView(row.original) },
                ],
                [
                  {
                    label: 'Delete',
                    icon: 'i-lucide-trash-2',
                    color: 'error' as const,
                    onSelect: () => actions.onDelete(row.original),
                    disabled: row.original.status !== 'Draft',
                  },
                ],
              ],
              content: { align: 'end' },
            },
            () =>
              h(ui.UButton, {
                icon: 'i-lucide-more-vertical',
                color: 'neutral',
                variant: 'ghost',
                class: 'h-8 w-8 p-0',
              }),
          ),
        ]),
    },
  ]

  return { columns }
}