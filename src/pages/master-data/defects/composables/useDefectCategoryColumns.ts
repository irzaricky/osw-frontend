import { h, Ref, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { DefectCategory } from '../../../../types/master-data/defect'

interface ColumnActions {
  onEdit: (defectCategory: DefectCategory) => void
  onDelete: (defectCategory: DefectCategory) => void
}

interface ColumnComponents {
  UButton: Component | string
  UDropdownMenu: Component | string
}

export function useDefectCategoryColumns(actions: ColumnActions, components: ColumnComponents, pagination: Ref<{ page: number; limit: number }>) {
  const { UButton, UDropdownMenu } = components

  const columns: TableColumn<DefectCategory>[] = [
    {
      header: 'No',
      cell: ({ row }) => (pagination.value.page - 1) * pagination.value.limit + row.index + 1
    },
    {
      accessorKey: 'name',
      header: 'Defect Category Name'
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => row.original.description || '-'
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const defectCategory = row.original

        const items = [
          [
            {
              label: 'Edit',
              icon: 'i-lucide-edit',
              onSelect: () => actions.onEdit(defectCategory)
            }
          ],
          [
            {
              label: 'Delete',
              icon: 'i-lucide-trash-2',
              color: 'error' as const,
              onSelect: () => actions.onDelete(defectCategory)
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