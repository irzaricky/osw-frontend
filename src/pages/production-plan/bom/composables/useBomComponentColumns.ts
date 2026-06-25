import { h, isRef, computed } from 'vue'
import type { Ref } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { LocalDetail } from '../composables/useBomForm'

interface Actions {
  onEdit: (d: LocalDetail) => void
  onDelete: (d: LocalDetail) => void
  onViewChildBom: (childBomId: number) => void // ← tambah ini
}

interface Components {
  UButton: any
  UDropdownMenu: any
  UBadge: any
}

function typeColor(type?: string | null): 'info' | 'warning' | 'neutral' | 'success' {
  switch (type) {
    case 'material':  return 'info'
    case 'phantom':   return 'warning'
    case 'byproduct': return 'neutral'
    case 'co-product': return 'success'
    default:          return 'neutral'
  }
}

export function useBomComponentColumns(
  actions: Actions,
  components: Components,
  resolveUomCode: (d: LocalDetail) => string,
  isEditable: Ref<boolean> | boolean,
  pageOffset: Ref<number> | number,
) {
  const { UButton, UDropdownMenu, UBadge } = components
  const isEditableRef = isRef(isEditable) ? isEditable : computed(() => isEditable)
  const pageOffsetRef = isRef(pageOffset) ? pageOffset : computed(() => pageOffset)

  const columns: TableColumn<LocalDetail>[] = [
    {
      header: '#',
      cell: ({ row }) => pageOffsetRef.value + row.index + 1,
    },
    {
      header: 'Part Number',
      cell: ({ row }) => row.original._part?.part_number ?? `#${row.original.part_id}`,
    },
    {
      header: 'Part Name',
      cell: ({ row }) => row.original._part?.part_name ?? '—',
    },
    {
      header: 'Lvl',
      cell: ({ row }) =>
        row.original.level != null
          ? h(UBadge, { label: `L${row.original.level}`, color: 'neutral', variant: 'soft', size: 'sm' })
          : '—',
    },
    {
      header: 'Type',
      cell: ({ row }) =>
        row.original.type
          ? h(UBadge, { label: row.original.type, color: typeColor(row.original.type), variant: 'subtle', size: 'sm' })
          : '—',
    },
    {
      header: 'Qty',
      cell: ({ row }) =>
        Number(row.original.qty_required).toLocaleString('en-US', { maximumFractionDigits: 4 }),
    },
    {
      header: 'UOM',
      cell: ({ row }) => resolveUomCode(row.original),
    },
    {
      header: 'Scrap %',
      cell: ({ row }) =>
        Number(row.original.scrap_percentage) > 0 ? `${row.original.scrap_percentage}%` : '—',
    },
    {
      // ← Child BOM sekarang bisa diklik jika ada child_bom_id
      header: 'Child BOM',
      cell: ({ row }) => {
        const cb = row.original._child_bom
        if (!cb) return '—'

        const label = `${cb.bom_number} v${cb.bom_version}`

        // Jika ada child_bom_id, render sebagai tombol link
        const childBomId = row.original.child_bom_id ?? cb.id ?? null
        if (childBomId) {
          return h(
            UButton,
            {
              label,
              color: 'neutral',
              variant: 'link',
              size: 'sm',
              icon: 'i-lucide-external-link',
              trailing: true,
              class: 'px-0',
              onClick: () => actions.onViewChildBom(childBomId),
            },
          )
        }

        return label
      },
    },
    {
      header: 'Notes',
      cell: ({ row }) => row.original.notes ?? '—',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        if (!isEditableRef.value) return null
        return h(
          UDropdownMenu,
          {
            items: [
              [
                { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => actions.onEdit(row.original) },
              ],
              [
                { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => actions.onDelete(row.original) },
              ],
            ],
          },
          () => h(UButton, { color: 'neutral', variant: 'ghost', size: 'sm', icon: 'i-lucide-ellipsis-vertical' }),
        )
      },
    },
  ]

  return { columns }
}