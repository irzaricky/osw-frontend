import { h, type Component, type Ref, computed, isRef } from 'vue'
import type { TableColumn } from '@nuxt/ui'

interface Actions {
  onEdit: (index: number) => void
  onDelete: (index: number) => void
  onPrintLabel: (index: number) => void
}

interface Components {
  UButton: Component | string
  UDropdownMenu: Component | string
}

export function useWorkOrderStoringItemColumns(
  actions: Actions,
  components: Components,
  parts: Ref<{ id: number; part_number: string; part_name: string }[]> | { id: number; part_number: string; part_name: string }[],
  mode: 'add' | 'edit' = 'add',
  isEditable: Ref<boolean> | boolean = true,
  woStatusId: Ref<number | undefined> | number | undefined,
  woCategory: Ref<string | undefined> | string | undefined
) {
  const partsRef = isRef(parts) ? parts : computed(() => parts)
  const editableRef = isRef(isEditable) ? isEditable : computed(() => isEditable)
  const statusRef = isRef(woStatusId) ? woStatusId : computed(() => woStatusId)
  const categoryRef = isRef(woCategory) ? woCategory : computed(() => woCategory)
  
  const { UButton, UDropdownMenu } = components

  const getDropdownItems = (rowIndex: number) => {
    const items = [
      {
        label: 'Detail & Edit',
        icon: 'i-lucide-pencil',
        onSelect: () => actions.onEdit(rowIndex)
      },
      {
        label: 'Delete',
        icon: 'i-lucide-trash',
        disabled: !editableRef.value,
        onSelect: () => actions.onDelete(rowIndex)
      }
    ]

    if (mode === 'edit' && statusRef.value !== 1 && categoryRef.value === 'Placement') {
      items.push({
        label: 'Print Label',
        icon: 'i-lucide-tag',
        onSelect: () => actions.onPrintLabel(rowIndex)
      })
    }

    return items
  }

  const columns = computed<TableColumn<any>[]>(() => [
    {
      header: 'Part Number',
      cell: ({ row }) => {
        const part = partsRef.value.find(p => p.id === row.original.part_id)
        return part?.part_number || '-'
      }
    },
    {
      header: 'Part Name',
      cell: ({ row }) => {
        const part = partsRef.value.find(p => p.id === row.original.part_id)
        return part?.part_name || '-'
      }
    },
    {
      accessorKey: 'total_kanban',
      header: 'Total Kanban'
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        h(UDropdownMenu, { items: getDropdownItems(row.index) }, () =>
          h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            size: 'sm',
            icon: 'i-lucide-more-horizontal'
          })
        )
    }
  ])

  return { columns }
}