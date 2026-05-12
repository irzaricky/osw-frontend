import { h, Ref, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { StorageBinStock } from '../../../../types/warehouse/warehouse-layout'

export function useStorageBinColumns(pagination: Ref<{ page: number; limit: number }>) {
  const columns: TableColumn<StorageBinStock>[] = [
    {
      header: 'No',
      cell: ({ row }) => (pagination.value.page - 1) * pagination.value.limit + row.index + 1
    },
    {
      accessorKey: 'label_number',
      header: 'Label Number'
    },
    {
      accessorKey: 'part_number',
      header: 'Part Number'
    },
    {
      accessorKey: 'part_name',
      header: 'Part Name'
    },
    {
      accessorKey: 'package_capacity',
      header: 'Qty per Kanban'
    },
    {
      accessorKey: 'created_at',
      header: 'Stored At',
      cell: ({ row }) => row.original.created_at ? new Date(row.original.created_at).toLocaleString() : '-'
    }
  ]

  return { columns }
}