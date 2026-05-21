import { h } from 'vue'
import type { Mrp } from '../../../../types/material/mrp'
import type { ColumnDef, Row } from '@tanstack/table-core'

interface UIComponents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  UCheckbox: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  UButton: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  UDropdownMenu: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  UBadge: any
}

interface Actions {
  onView: (id: number) => void
  onEdit: (mrp: Mrp) => void
  onDelete: (id: number) => void
}

export function useMrpColumns(actions: Actions, ui: UIComponents) {
  const getActionItems = (row: Row<Mrp>) => [
    [
      {
        label: 'View details',
        icon: 'i-lucide-list',
        onSelect: () => actions.onView(row.original.id)
      },
      {
        label: 'Edit',
        icon: 'i-lucide-pencil',
        onSelect: () => actions.onEdit(row.original)
      }
    ],
    [
      {
        label: 'Delete',
        icon: 'i-lucide-trash-2',
        color: 'error' as const,
        onSelect: () => actions.onDelete(row.original.id)
      }
    ]
  ]

  const columns: ColumnDef<Mrp>[] = [
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
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => row.original.id
    },
    {
      accessorKey: 'mrp_number',
      header: 'MRP Number',
      cell: ({ row }) => h('div', { class: 'font-medium text-highlighted' }, row.original.mrp_number)
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => row.original.description || '-'
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const colorMap: Record<string, string> = {
          High: 'error',
          Medium: 'warning',
          Low: 'success'
        }
        const val = row.original.priority
        if (!val) return h('span', { class: 'text-muted' }, '-')
        return h(ui.UBadge, { class: 'capitalize', variant: 'subtle', color: (colorMap[val] || 'neutral') as any }, () => val)
      }
    },
    {
      accessorKey: 'salesPlan',
      header: 'Sales Plan',
      cell: ({ row }) => row.original.salesPlan?.spr_number || '-'
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const colorMap: Record<string, string> = {
          Draft: 'neutral',
          Submitted: 'warning',
          Approved: 'success',
          Rejected: 'error'
        }
        const statusColor = colorMap[row.original.status] || 'neutral'
        return h(ui.UBadge, { class: 'capitalize', variant: 'subtle', color: statusColor as any }, () => row.original.status)
      }
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
            icon: 'i-lucide-ellipsis-vertical',
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