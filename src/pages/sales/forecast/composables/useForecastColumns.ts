import { h } from 'vue'
import type { Forecast } from '../../../../types/sales/forecast'
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
  onEdit: (forecast: Forecast) => void
  onDelete: (id: number) => void
}

export function useForecastColumns(actions: Actions, ui: UIComponents) {
  const getActionItems = (row: Row<Forecast>) => [
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

  const columns: ColumnDef<Forecast>[] = [
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
      accessorKey: 'forecast_number',
      header: 'Forecast Number',
      cell: ({ row }) => h('div', { class: 'font-medium text-highlighted' }, row.original.forecast_number)
    },
    {
      accessorKey: 'forecast_type',
      header: 'Type',
      cell: ({ row }) => row.original.forecast_type
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => row.original.customer?.name || '-'
    },
    {
      id: 'period',
      header: 'Period',
      cell: ({ row }) => `${row.original.start_period} to ${row.original.end_period}`
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

        return h(ui.UBadge, { class: 'capitalize', variant: 'subtle', color: statusColor as any }, () =>
          row.original.status
        )
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
