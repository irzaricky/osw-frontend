import {
  h,
  type Component
} from 'vue'

import type {
  TableColumn
} from '@nuxt/ui'

import type {
  WarrantyClaim
} from '../../../../types/warehouse/warranty-and-claim'

interface ColumnComponents {
  UBadge: Component | string
}

function getCategoryColor(
  category?: string
):
  | 'warning'
  | 'error'
  | 'neutral' {

  if (!category) {
    return 'neutral'
  }

  if (
    category ===
    'Quantity'
  ) {
    return 'warning'
  }

  if (
    category ===
    'Quality'
  ) {
    return 'error'
  }

  return 'neutral'
}

export function useWarrantyAndClaimColumns(
  components: ColumnComponents
) {

  const {
    UBadge
  } = components

  const columns:
    TableColumn<WarrantyClaim>[] = [

    {
      accessorKey: 'no',
      header: 'No'
    },

    {
      accessorKey:
        'ng_ticket_number',

      header:
        'NG Ticket',

      cell: ({ row }) =>
        row.original
          .ng_ticket_number
    },

    {
      accessorKey:
        'category',

      header:
        'Category',

      cell: ({ row }) =>
        h(
          UBadge,
          {
            color:
              getCategoryColor(
                row.original
                  .category
              ),

            variant: 'subtle'
          },

          () =>
            row.original
              .category
        )
    },

    {
      accessorKey:
        'po_number',

      header:
        'PO Number',

      cell: ({ row }) =>
        row.original
          .po_number || '-'
    },

    {
      accessorKey:
        'do_number',

      header:
        'DO Number',

      cell: ({ row }) =>
        row.original
          .do_number || '-'
    },

    {
      accessorKey:
        'supplier',

      header:
        'Supplier',

      cell: ({ row }) =>
        row.original
          .supplier || '-'
    },

    {
      accessorKey:
        'label_number',

      header:
        'Label Number',

      cell: ({ row }) =>
        row.original
          .label_number || '-'
    },

    {
      accessorKey:
        'quantity',

      header:
        'Quantity Detail',

      cell: ({ row }) => {

        const quantity =
          row.original
            .quantity

        if (!quantity) {
          return '-'
        }

        return `${quantity.actual_qty} / ${quantity.expected_qty}`
      }
    },

    {
      accessorKey:
        'defects',

      header:
        'Defects',

      cell: ({ row }) => {

        const defects =
          row.original
            .defects || []

        if (
          defects.length <= 0
        ) {
          return '-'
        }

        return defects
          .map(
            defect =>
              defect.defect_name
          )
          .join(', ')
      }
    },

    {
      accessorKey:
        'created_at',

      header:
        'Created At',

      cell: ({ row }) =>
        row.original
          .created_at
          ? new Date(
              row.original
                .created_at
            ).toLocaleString()
          : '-'
    }
  ]

  return { columns }
}