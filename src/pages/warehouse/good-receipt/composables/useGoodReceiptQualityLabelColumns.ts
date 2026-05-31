import { h, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { GoodReceiptQualityLabel } from '../../../../types/warehouse/good-receipt'

interface ColumnActions {
  onViewImages: (label: GoodReceiptQualityLabel) => void
}

interface ColumnComponents {
  UBadge: Component | string
  UButton: Component | string
  UDropdownMenu: Component | string
}

function getJudgementColor(
  judgement?: string
): 'success' | 'error' | 'neutral' {
  if (!judgement) return 'neutral'

  if (judgement === 'OK') {
    return 'success'
  }

  if (judgement === 'NG') {
    return 'error'
  }

  return 'neutral'
}

export function useGoodReceiptQualityLabelColumns(actions: ColumnActions, components: ColumnComponents) {
  const { UBadge, UButton, UDropdownMenu } = components

  const columns: TableColumn<GoodReceiptQualityLabel>[] = [
    {
      header: 'No',
      cell: ({ row }) => row.index + 1
    },
    {
      accessorKey: 'label_number',
      header: 'Label Number'
    },
    {
      accessorKey: 'judgement',
      header: 'Judgement',
      cell: ({ row }) =>
        h(
          UBadge,
          {
            color: getJudgementColor(row.original.judgement),
            variant: 'subtle'
          },
          () => row.original.judgement || '-'
        )
    },
    {
      accessorKey: 'defects',
      header: 'Defects',
      cell: ({ row }) => {
        const defects = row.original.defects || []

        if (defects.length === 0) {
          return '-'
        }

        return defects
          .map(
            defect => defect.defect_name
          )
          .filter(Boolean)
          .join(', ')
      }
    },
    {
      accessorKey: 'ng_ticket_number',
      header: 'NG Ticket',
      cell: ({ row }) => row.original.ng_ticket_number || '-'
    },
    {
      accessorKey: 'scanned_at',
      header: 'Scanned At',
      cell: ({ row }) => row.original.scanned_at ? new Date(row.original.scanned_at).toLocaleString() : '-'
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const label = row.original

        const hasImages =
          (
            label.defects || []
          ).some(
            defect => !!defect.image
          )

        const items = [
          [
            {
              label: 'View Evidence',
              icon: 'i-lucide-image',
              disabled: label.judgement === 'OK' || !hasImages,
              onSelect: () => {
                if (label.judgement !== 'OK' && hasImages) {
                  actions.onViewImages(label)
                }
              }
            }
          ]
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