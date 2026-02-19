import { h, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { AuditLog } from '../../../../types/master-data/audit-log'

interface ColumnActions {
  onViewDetail: (log: AuditLog) => void
}

interface ColumnComponents {
  UBadge: Component | string
  UButton: Component | string
}

export function useLogColumns(actions: ColumnActions, components: ColumnComponents) {
  const { UBadge, UButton } = components

  const columns: TableColumn<AuditLog>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date/Time',
      cell: ({ row }) => {
        const date = row.original.createdAt
        return date ? new Date(date).toLocaleString() : '-'
      }
    },
    {
      accessorKey: 'user.email',
      header: 'User',
      cell: ({ row }) => row.original.user?.email || '-'
    },
    {
      accessorKey: 'module.name',
      header: 'Module',
      cell: ({ row }) => {
        const name = row.original.module?.name
        return h(UBadge, { color: 'neutral', variant: 'subtle' }, () => name || '-')
      }
    },
    {
      accessorKey: 'activity.name',
      header: 'Activity',
      cell: ({ row }) => {
        const activity = row.original.activity
        const isDelete = activity?.code === 'DELETE'
        return h(
          UBadge, 
          { color: isDelete ? 'error' : 'primary', variant: 'subtle' }, 
          () => activity?.name || '-'
        )
      }
    },
    {
      accessorKey: 'description',
      header: 'Description'
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        return h(UButton, {
          icon: 'i-lucide-eye',
          color: 'neutral',
          variant: 'ghost',
          size: 'xs',
          label: 'View Detail',
          onClick: () => actions.onViewDetail(row.original)
        })
      }
    }
  ]

  return { columns }
}
