import { h, Ref, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { QualityCheckingLabel } from '../../../../types/warehouse/material-receiving'

interface ColumnActions {
  onMarkDefect: (label: QualityCheckingLabel) => void
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

export function useQualityCheckingColumns(
  actions: ColumnActions,
  components: ColumnComponents,
  isSubmitted: Ref<boolean> | boolean
) {
  const { UBadge, UButton, UDropdownMenu } = components

  const columns: TableColumn<QualityCheckingLabel>[] = [
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
            color: getJudgementColor(row.original.judgement),
            variant: 'subtle'
          },
          () => row.original.judgement || '-'
        )
    },
    {
      accessorKey: 'defects',
      header: 'Defect',
      cell: ({ row }) => {
        const defects = row.original.ng_ticket?.defects || []
        if (row.original.judgement === 'OK') {
          return '-'
        }
        if (defects.length <= 0) {
          return '-'
        }
        return defects.map(defect => defect.defect_name).join(', ')
      }
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
              label: 'Mark as Defect',
              icon: 'i-lucide-shield-alert',
              disabled: submitted || label.judgement === 'NG',
              onSelect: () => {
                if (
                  !submitted && label.judgement !== 'NG'
                ) {
                  actions.onMarkDefect(
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