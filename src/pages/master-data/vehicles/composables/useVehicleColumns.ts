import { h, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Vehicle } from '../../../../types'

interface ColumnActions {
  onEdit: (vehicle: Vehicle) => void
  onDelete: (vehicle: Vehicle) => void
  onToggleStatus: (vehicle: Vehicle) => void
}

interface ColumnComponents {
  UCheckbox: Component | string
  UBadge: Component | string
  UButton: Component | string
  UDropdownMenu: Component | string
}

export function useVehicleColumns(actions: ColumnActions, components: ColumnComponents) {
  const { UCheckbox, UBadge, UButton, UDropdownMenu } = components

  const columns: TableColumn<Vehicle>[] = [
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
    { accessorKey: 'id', header: 'ID' },
    {
      accessorKey: 'vehicle_code',
      header: 'Vehicle Code'
    },
    {
      accessorKey: 'plate_number',
      header: 'Plate Number'
    },
    {
      accessorKey: 'vehicle_type.name',
      header: 'Vehicle Type',
      cell: ({ row }) => {
        return h(UBadge, { color: 'primary', variant: 'subtle' }, () => row.original.vehicle_type?.name || '-')
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.status ?? row.original.active
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
        const vehicle = row.original

        const items = [
          [
            {
              label: 'Edit',
              icon: 'i-lucide-edit',
              onSelect: () => actions.onEdit(vehicle)
            },
            {
              label: vehicle.status || vehicle.active ? 'Deactivate' : 'Activate',
              icon: vehicle.status || vehicle.active ? 'i-lucide-toggle-right' : 'i-lucide-toggle-left',
              onSelect: () => actions.onToggleStatus(vehicle)
            }
          ],
          [
            {
              label: 'Delete',
              icon: 'i-lucide-trash-2',
              color: 'error' as const,
              onSelect: () => actions.onDelete(vehicle)
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
