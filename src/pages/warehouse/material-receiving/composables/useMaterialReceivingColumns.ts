import { h, Ref, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { MaterialReceiving } from '../../../../types/warehouse/material-receiving'

interface ColumnActions {
  onProcess: (materialReceiving: MaterialReceiving) => void
  onViewProgress: (materialReceiving: MaterialReceiving) => void
}

interface ColumnComponents {
  UBadge: Component | string
  UButton: Component | string
  UDropdownMenu: Component | string
}

function getStatusColor(statusCode?: string): string {
  if (!statusCode) return 'neutral'

  const colors: Record<string, string> = {
    'in transit': 'neutral',
    'arrived': 'info',
    'quantity checking': 'warning',
    'quality checking': 'error',
    'waiting gr approval': 'secondary',
    'good receipt': 'success'
  }

  return colors[statusCode.toLowerCase()] || 'neutral'
}

export function useMaterialReceivingColumns(actions: ColumnActions, components: ColumnComponents, pagination: Ref<{ page: number; limit: number }>) {
  const { UBadge, UButton, UDropdownMenu } = components

  const columns: TableColumn<MaterialReceiving>[] = [
    {
      header: 'No',
      cell: ({ row }) => (pagination.value.page - 1) * pagination.value.limit + row.index + 1
    },
    {
      accessorKey: 'number',
      header: 'MDO Number'
    },
    {
      accessorKey: 'supplier',
      header: 'Supplier'
    },
    {
      accessorKey: 'warehouse',
      header: 'Warehouse'
    },
    {
      accessorKey: 'dock',
      header: 'Dock'
    },
    {
      accessorKey: 'transporter',
      header: 'Transporter'
    },
    {
      accessorKey: 'target_date',
      header: 'Target Date',
      cell: ({ row }) => row.original.target_date ? new Date(row.original.target_date).toLocaleDateString() : '-'
    },
    {
      accessorKey: 'arrived_at',
      header: 'Arrived At',
      cell: ({ row }) => row.original.arrived_at ? new Date(row.original.arrived_at).toLocaleString() : '-'
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) =>
        h(
          UBadge,
          { color: getStatusColor(row.original.status), variant: 'subtle' },
          () => row.original.status || '-'
        )
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const materialReceiving = row.original

        const items = [
          {
            label: 'Set Arrived & Process',
            icon: 'i-lucide-package-search',
            onSelect: () => actions.onProcess(materialReceiving)
          },
          {
            label: 'View Progress',
            icon: 'i-lucide-eye',
            onSelect: () => actions.onViewProgress(materialReceiving)
          }
        ]

        return h(UDropdownMenu, {
          items
        }, {
          default: () => h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            icon: 'i-lucide-ellipsis-vertical'
          })
        })
      }
    }
  ]

  return { columns }
}