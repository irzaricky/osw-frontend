import { h, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { MaterialReceivingProgressItem } from '../../../../types/warehouse/material-receiving'

interface ColumnActions {
  onQuantityCheck: (item: MaterialReceivingProgressItem) => void
  onQualityCheck: (item: MaterialReceivingProgressItem) => void
}

interface ColumnComponents {
  UBadge: Component | string
  UButton: Component | string
  UDropdownMenu: Component | string
}

function getProgressStatus(mrStatus: string, item: MaterialReceivingProgressItem) {
  if (mrStatus.toLowerCase() === 'in transit') {
    return {
      label: 'Waiting Arrival',
      color: 'neutral'
    }
  }
  if (!item.quantity_checked_at) {
    return {
      label: 'Pending Quantity Check',
      color: 'warning'
    }
  }
  if (item.quantity_checked_at && !item.quality_checked_at) {
    return {
      label: 'Pending Quality Check',
      color: 'info'
    }
  }
  return {
    label: 'Completed',
    color: 'success'
  }
}

export function useMaterialReceivingProgressColumns(
  materialReceivingStatus: string,
  actions: ColumnActions, 
  components: ColumnComponents,
) {
  const { UBadge, UButton, UDropdownMenu } = components

  const columns: TableColumn<MaterialReceivingProgressItem>[] = [
    {
      header: 'No',
      cell: ({ row }) => row.index + 1
    },
    {
      accessorKey: 'part_number',
      header: 'Part Number'
    },
    {
      accessorKey: 'part_name',
      header: 'Part Name'
    },
    {
      accessorKey: 'total_qty',
      header: 'Expected Qty',
      cell: ({ row }) => row.original.total_qty || '0'
    },
    {
      accessorKey: 'total_qty_actual',
      header: 'Actual Qty',
      cell: ({ row }) => row.original.total_qty_actual || '-'
    },
    {
      accessorKey: 'quantity_checked_at',
      header: 'Qty Checked At',
      cell: ({ row }) => row.original.quantity_checked_at ? new Date(row.original.quantity_checked_at).toLocaleString() : '-'
    },
    {
      accessorKey: 'quality_check_ok',
      header: 'Quality Check OK',
      cell: ({ row }) => row.original.quality_check_ok || '-'
    },
    {
      accessorKey: 'quality_check_ng',
      header: 'Quality Check NG',
      cell: ({ row }) => row.original.quality_check_ng || '-'
    },
    {
      accessorKey: 'quality_checked_at',
      header: 'Quality Checked At',
      cell: ({ row }) => row.original.quality_checked_at ? new Date(row.original.quality_checked_at).toLocaleString() : '-'
    },
    {
      id: 'progress',
      header: 'Progress',
      cell: ({ row }) => { const progress = getProgressStatus(materialReceivingStatus, row.original)
        return h(
          UBadge,
          {
            color: progress.color as
              | 'warning'
              | 'info'
              | 'success',
            variant: 'subtle'
          },
          () => progress.label
        )
      }
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const item = row.original
        const quantityDisabled = materialReceivingStatus.toLowerCase() === 'in transit'
        const qualityDisabled = !item.quantity_checked_at

        const items = [
          {
            label: 'Quantity Checking',
            icon: 'i-lucide-package-check',
            disabled: quantityDisabled,
            onSelect: () => {
              if (!quantityDisabled) {
                actions.onQuantityCheck(item)
              }
            }
          },
          {
            label: 'Quality Checking',
            icon: 'i-lucide-shield-check',
            disabled: qualityDisabled,
            onSelect: () => {
              if (!qualityDisabled) {
                actions.onQualityCheck(item)
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