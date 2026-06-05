import { h, Ref, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { GoodReceipt } from '../../../../types/warehouse/good-receipt'

interface ColumnActions {
  onViewDetail: (goodReceipt: GoodReceipt) => void
  onApprove: (goodReceipt: GoodReceipt) => void
  onDownloadReport: (goodReceipt: GoodReceipt) => void
}

interface ColumnComponents {
  UBadge: Component | string
  UButton: Component | string
  UDropdownMenu: Component | string
}

function getStatusColor(status?: string): 'warning' | 'success' | 'neutral' {
  if (!status) {
    return 'neutral'
  }

  if (status === 'Waiting GR Approval') {
    return 'warning'
  }

  if (status === 'Good Receipt') {
    return 'success'
  }

  return 'neutral'
}

export function useGoodReceiptColumns(actions: ColumnActions, components: ColumnComponents, pagination: Ref<{ page: number; limit: number }>) {
  const { UBadge, UButton, UDropdownMenu } = components

  const columns: TableColumn<GoodReceipt>[] = [
    {
      header: 'No',
      cell: ({ row }) => (pagination.value.page - 1) * pagination.value.limit + row.index + 1
    },
    {
      accessorKey: 'po_number',
      header: 'MPO Number'
    },
    {
      accessorKey: 'do_number',
      header: 'MDO Number'
    },
    {
      accessorKey: 'supplier',
      header: 'Supplier'
    },
    {
      accessorKey: 'arrived_at',
      header: 'Arrived At',
      cell: ({ row }) => row.original.arrived_at ? new Date(row.original.arrived_at).toLocaleDateString() : '-'
    },
    {
      accessorKey: 'total_part',
      header: 'Total Part',
      cell: ({ row }) => row.original.total_part || '0'
    },
    {
      accessorKey: 'accepted_label',
      header: 'Accepted Label',
      cell: ({ row }) => row.original.accepted_label || '-'
    },
    {
      accessorKey: 'gr_status',
      header: 'Status',
      cell: ({ row }) =>
        h(
          UBadge,
          {
            color: getStatusColor(row.original.gr_status),
            variant: 'subtle'
          },
          () => row.original.gr_status
        )
    },
    {
      accessorKey: 'gr_remarks',
      header: 'Remarks',
      cell: ({ row }) => row.original.gr_remarks || '-'
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const receipt = row.original
        const items = [
          {
            label: 'View Detail',
            icon: 'i-lucide-eye',
            onSelect: () => actions.onViewDetail(receipt)
          },
          {
            label: 'Approve',
            icon: 'i-lucide-check-check',
            disabled: receipt.gr_status === 'Good Receipt',
            onSelect: () => {
              if (receipt.gr_status !== 'Good Receipt') {
                actions.onApprove(receipt)
              }
            }
          },
          {
            label: 'View Report',
            icon: 'i-lucide-file-text',
            disabled: receipt.gr_status === 'Waiting GR Approval',
            onSelect: () => {
              if (receipt.gr_status !== 'Waiting GR Approval') {
                actions.onDownloadReport(receipt)
              }
            }
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