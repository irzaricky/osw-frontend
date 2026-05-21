import {
  h,
  type Component
} from 'vue'

import type {
  TableColumn
} from '@nuxt/ui'

import type {
  GoodReceipt
} from '../../../../types/warehouse/good-receipt'

interface ColumnActions {
  onApprove: (
    row: GoodReceipt
  ) => void
}

interface ColumnComponents {
  UBadge: Component | string
  UButton: Component | string
  UDropdownMenu:
    | Component
    | string
}

function getStatusColor(
  status?: string
):
  | 'warning'
  | 'success'
  | 'neutral' {

  if (!status) {
    return 'neutral'
  }

  if (
    status ===
    'Waiting GR Approval'
  ) {
    return 'warning'
  }

  if (
    status ===
    'Good Receipt'
  ) {
    return 'success'
  }

  return 'neutral'
}

export function useGoodReceiptColumns(
  actions: ColumnActions,

  components: ColumnComponents
) {

  const {
    UBadge,
    UButton,
    UDropdownMenu
  } = components

  const columns:
    TableColumn<GoodReceipt>[] = [

    {
      accessorKey: 'no',
      header: 'No'
    },

    {
      accessorKey: 'po_number',
      header: 'PO Number',

      cell: ({ row }) =>
        row.original.po_number ||
        '-'
    },

    {
      accessorKey: 'do_number',
      header: 'DO Number',

      cell: ({ row }) =>
        row.original.do_number ||
        '-'
    },

    {
      accessorKey: 'supplier',
      header: 'Supplier',

      cell: ({ row }) =>
        row.original.supplier ||
        '-'
    },

    {
      accessorKey:
        'label_qty_inspection',

      header:
        'Qty Inspection',

      cell: ({ row }) =>
        row.original
          .label_qty_inspection
    },

    {
      accessorKey:
        'label_quality_inspection',

      header:
        'Quality Inspection',

      cell: ({ row }) =>
        row.original
          .label_quality_inspection
    },

    {
      accessorKey:
        'gr_status',

      header: 'Status',

      cell: ({ row }) =>
        h(
          UBadge,
          {
            color:
              getStatusColor(
                row.original
                  .gr_status
              ),

            variant: 'subtle'
          },

          () =>
            row.original
              .gr_status
        )
    },

    {
      accessorKey:
        'gr_remarks',

      header: 'Remarks',

      cell: ({ row }) =>
        row.original
          .gr_remarks || '-'
    },

    {
      id: 'actions',

      header: '',

      cell: ({ row }) => {

        const receipt =
          row.original

        const items = [
          [
            {
              label:
                'Approve Good Receipt',

              icon:
                'i-lucide-check-check',

              disabled:
                receipt.gr_status ===
                'Good Receipt',

              onSelect: () => {
                if (
                  receipt.gr_status !==
                  'Good Receipt'
                ) {
                  actions.onApprove(
                    receipt
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

                icon:
                  'i-lucide-ellipsis-vertical'
              })
          }
        )
      }
    }
  ]

  return { columns }
}