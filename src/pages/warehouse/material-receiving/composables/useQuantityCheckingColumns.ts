import { h, Ref, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { QuantityCheckingLabel } from '../../../../types/warehouse/material-receiving'

interface ColumnActions {
  onMarkIncomplete: (label: QuantityCheckingLabel) => void
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

export function useQuantityCheckingColumns(
  actions: ColumnActions, 
  components: ColumnComponents, 
  isSubmitted: Ref<boolean> | boolean
) {
  const { UBadge, UButton, UDropdownMenu } = components

  const columns: TableColumn<QuantityCheckingLabel>[] = [
    {
      header: 'No',
      cell: ({ row }) => row.index + 1
    },
    {
      accessorKey: 'label_number',
      header: 'Label Number',
      cell: ({ row }) => row.original.label_number || '-'
    },
    {
      accessorKey: 'judgement',
      header: 'Judgement',
      cell: ({ row }) =>
        h(
          UBadge,
          {
            color: getJudgementColor(
              row.original.judgement
            ),
            variant: 'subtle'
          },
          () => row.original.judgement || '-'
        )
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

        const submitted = typeof isSubmitted === 'boolean' ? isSubmitted : isSubmitted.value

        const items = [
          [
            {
              label: 'Mark as Incomplete',
              icon: 'i-lucide-circle-off',
              disabled: submitted || label.judgement === 'NG',
              onSelect: () => {
                if (
                  label.judgement !== 'NG'
                ) {
                  actions.onMarkIncomplete(
                    label
                  )
                }
              }
            }
          ]
        ]

        return h(
          UDropdownMenu,
          {
            items
          },
          {
            default: () =>
              h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                icon: 'i-lucide-ellipsis-vertical'
              })
          }
        )
      }
    }
  ]

  return { columns }
}