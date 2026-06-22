import { h, Ref, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { WorkOrderStoring } from '../../../../types/warehouse/work-order-storing'

interface ColumnActions {
  onEdit: (workOrderStoring: WorkOrderStoring) => void
  onDelete: (workOrderStoring: WorkOrderStoring) => void
}

interface ColumnComponents {
  UBadge: Component | string
  UButton: Component | string
  UDropdownMenu: Component | string
}

function getStatusColor(statusId?: number): string {
  if (!statusId) return 'neutral'

  const colors: Record<number, string> = {
    1: 'neutral',  // draft
    2: 'secondary',  // submitted
    3: 'warning',  // in progress
    4: 'success'     // completed
  }

  return colors[statusId] || 'neutral'
}

export function useWorkOrderStoringColumns(actions: ColumnActions, components: ColumnComponents, pagination: Ref<{ page: number; limit: number }>) {
  const { UBadge, UButton, UDropdownMenu } = components

  const columns: TableColumn<WorkOrderStoring>[] = [
    {
      header: 'No',
      cell: ({ row }) => (pagination.value.page - 1) * pagination.value.limit + row.index + 1
    },
    {
      accessorKey: 'wo_number',
      header: 'Work Order Number'
    },
    {
      accessorKey: 'wo_date',
      header: 'Work Order Date',
      cell: ({ row }) => row.original.wo_date ? new Date(row.original.wo_date).toLocaleDateString() : '-'
    },
    {
      accessorKey: 'ref_doc_number',
      header: 'Reff Doc Number',
      cell: ({ row }) => row.original.ref_doc_number || '-'
    },
    {
      accessorKey: 'ref_doc_name',
      header: 'Reff Doc Name',
      cell: ({ row }) => row.original.ref_doc_name || '-'
    },
    {
      accessorKey: 'area.name',
      header: 'Warehouse Area',
      cell: ({ row }) => row.original.area?.name || '-'
    },
    {
      accessorKey: 'wo_description',
      header: 'Description',
      cell: ({ row }) => row.original.wo_description || '-'
    },
    {
      accessorKey: 'type.name',
      header: 'Work Order Type',
      cell: ({ row }) => row.original.type?.name || '-'
    },
    {
      accessorKey: 'wo_category',
      header: 'Work Order Category'
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : '-'
    },
    {
      accessorKey: 'user.user_detail.full_name',
      header: 'Created By',
      cell: ({ row }) => row.original.user?.user_detail?.full_name || row.original.user?.email || '-'
    },
    {
      accessorKey: 'status.name',
      header: 'Status',
      cell: ({ row }) =>
        h(
          UBadge,
          { color: getStatusColor(row.original.status?.id), variant: 'subtle' },
          () => row.original.status?.name || '-'
        )
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const workOrderStoring = row.original

        const items = [
          [
            {
              label: 'Detail & Edit',
              icon: 'i-lucide-edit',
              onSelect: () => actions.onEdit(workOrderStoring)
            }
          ],
          [
            {
              label: 'Delete',
              icon: 'i-lucide-trash-2',
              color: 'error' as const,
              onSelect: () => actions.onDelete(workOrderStoring)
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