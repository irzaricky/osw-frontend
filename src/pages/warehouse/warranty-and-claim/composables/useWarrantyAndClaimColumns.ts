import { h, Ref, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { WarrantyAndClaim } from '../../../../types/warehouse/warranty-and-claim'

interface ColumnActions {
  onViewEvidence: (warrantyAndClaim: WarrantyAndClaim) => void
}

interface ColumnComponents {
  UBadge: Component | string
  UButton: Component | string
  UDropdownMenu: Component | string
}

function getCategoryColor(category?: string | null): 'warning' | 'error' | 'neutral' {
  if (!category) {
    return 'neutral'
  }

  if (category === 'Quantity') {
    return 'warning'
  }

  if (category === 'Quality') {
    return 'error'
  }

  return 'neutral'
}

export function useWarrantyAndClaimColumns(actions: ColumnActions, components: ColumnComponents, pagination: Ref<{ page: number; limit: number }>) {
  const { UBadge, UButton, UDropdownMenu } = components

  const columns: TableColumn<WarrantyAndClaim>[] = [
    {
      header: 'No',
      cell: ({ row }) => (pagination.value.page - 1) * pagination.value.limit + row.index + 1
    },
    {
      accessorKey: 'ng_ticket_number',
      header: 'NG Ticket'
    },
    {
      accessorKey: 'label_number',
      header: 'Label Number'
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) =>
        h(
          UBadge,
          {
            color: getCategoryColor(row.original.category),
            variant: 'subtle'
          },
          () => row.original.category
        )
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
      accessorKey: 'supplier',
      header: 'Supplier'
    },
    {
      accessorKey: 'rejected_info',
      header: 'Rejected Info'
    },
    {
      accessorKey: 'mpo_number',
      header: 'MPO Number'
    },
    {
      accessorKey: 'mdo_number',
      header: 'MDO Number'
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) =>
        row.original
          .created_at
          ? new Date(
              row.original
                .created_at
            ).toLocaleString()
          : '-'
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const warrantyAndClaim = row.original

        const hasImages =
          (
            warrantyAndClaim.defects || []
          ).some(
            defect => !!defect.image
          )
        
        const items = [
          {
            label: 'View Evidence',
            icon: 'i-lucide-image',
            disabled: !hasImages,
            onSelect: () => {
              if (hasImages) {
                actions.onViewEvidence(warrantyAndClaim)
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