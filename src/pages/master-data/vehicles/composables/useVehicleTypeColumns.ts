import { h, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { VehicleType } from '../../../../types'

interface ColumnActions {
  onEdit: (vehicleType: VehicleType) => void
  onDelete: (vehicleType: VehicleType) => void
}

interface ColumnComponents {
  UButton: Component | string
  [key: string]: any
}

export const useVehicleTypeColumns = (actions: ColumnActions, components: ColumnComponents) => {
  const { UButton } = components

  const columns: TableColumn<VehicleType>[] = [
    {
      header: 'No',
      cell: ({ row }) => row.index + 1
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'load_capacity',
      header: 'Load Capacity (kg)',
      cell: ({ row }) => row.original.load_capacity.toLocaleString()
    },
    {
      id: 'actions',
      header: () => h('div', { class: 'text-right' }, 'Actions'),
      cell: ({ row }) => {
        return h('div', { class: 'flex gap-2 justify-end' }, [
          h(UButton, {
            icon: 'i-lucide-edit',
            color: 'neutral',
            variant: 'ghost',
            size: 'sm',
            onClick: () => actions.onEdit(row.original)
          }),
          h(UButton, {
            icon: 'i-lucide-trash-2',
            color: 'error',
            variant: 'ghost',
            size: 'sm',
            onClick: () => actions.onDelete(row.original)
          })
        ])
      }
    }
  ]

  return {
    columns
  }
}
