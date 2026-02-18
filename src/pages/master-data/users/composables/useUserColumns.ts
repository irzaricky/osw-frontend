import { h, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { User } from '../../../../types'

interface ColumnActions {
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onToggleStatus: (user: User) => void
}

interface ColumnComponents {
  UCheckbox: Component | string
  UBadge: Component | string
  UButton: Component | string
  UDropdownMenu: Component | string
}

// Helper to generate consistent colors based on division ID
function getDivisionColor(divisionId?: number): string {
  if (!divisionId) return 'neutral'
  
  const colors: Record<number, string> = {
    1: 'secondary',
    2: 'warning',
    3: 'error',
    4: 'neutral'
  }

  return colors[divisionId] || 'neutral'
}

export function useUserColumns(actions: ColumnActions, components: ColumnComponents) {
  const { UCheckbox, UBadge, UButton, UDropdownMenu } = components

  const columns: TableColumn<User>[] = [
    {
      id: 'select',
      header: ({ table }) =>
        h(UCheckbox, {
          'modelValue': table.getIsSomePageRowsSelected()
            ? 'indeterminate'
            : table.getIsAllPageRowsSelected(),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
            table.toggleAllPageRowsSelected(!!value),
          'ariaLabel': 'Select all'
        }),
      cell: ({ row }) =>
        h(UCheckbox, {
          'modelValue': row.getIsSelected(),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
          'ariaLabel': 'Select row'
        })
    },
    {
      header: 'No',
      cell: ({ row }) => row.index + 1
    },
    {
      accessorKey: 'email',
      header: 'Email'
    },
    {
      accessorKey: 'user_detail.full_name',
      header: 'Full Name'
    },
    {
      accessorKey: 'role.name',
      header: 'Role',
      cell: ({ row }) => {
        const divisionId = row.original.role?.division?.id
        const color = getDivisionColor(divisionId)
        return h(UBadge, { color, variant: 'subtle' }, () => row.original.role?.name || '-')
      }
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.active
        return h(
          UBadge,
          { color: isActive ? 'success' : 'error', variant: 'subtle' },
          () => isActive ? 'Active' : 'Inactive'
        )
      }
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const user = row.original
        const isSuperadmin = user.role?.name === 'Superadmin'

        const items = [
          [
            {
              label: 'Edit',
              icon: 'i-lucide-edit',
              disabled: isSuperadmin,
              onSelect: () => actions.onEdit(user)
            },
            {
              label: user.active ? 'Deactivate' : 'Activate',
              icon: user.active ? 'i-lucide-user-x' : 'i-lucide-user-check',
              disabled: isSuperadmin,
              onSelect: () => actions.onToggleStatus(user)
            }
          ],
          [
            {
              label: 'Delete',
              icon: 'i-lucide-trash-2',
              color: 'error' as const,
              disabled: isSuperadmin,
              onSelect: () => actions.onDelete(user)
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
    },
    {
      id: 'expand',
      header: '',
      cell: ({ row }) =>
        h(UButton, {
          color: 'neutral',
          variant: 'ghost',
          icon: row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right',
          size: 'xs',
          onClick: () => row.toggleExpanded()
        })
    }
  ]

  return { columns }
}
