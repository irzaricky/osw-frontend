import { h, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { GoodReceiptQuantityLabel } from '../../../../types/warehouse/good-receipt'

interface ColumnComponents {
  UBadge: Component | string
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

export function useGoodReceiptQuantityLabelColumns(components: ColumnComponents) {
  const { UBadge } = components

  const columns: TableColumn<GoodReceiptQuantityLabel>[] = [
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
      accessorKey: 'expected_qty',
      header: 'Expected Qty'
    },
    {
      accessorKey: 'actual_qty',
      header: 'Actual Qty'
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
    }
  ]

  return { columns }
}