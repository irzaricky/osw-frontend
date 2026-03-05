import { h } from 'vue'
import type { StationJob } from '../../../../../../types/master-data/station'
import type { ColumnDef } from '@tanstack/table-core'

interface UIComponents {
  UCheckbox: any
  UButton: any
  UDropdownMenu: any
  UBadge: any
}

interface Actions {
  onEdit: (sj: StationJob) => void
  onDelete: (sj: StationJob) => void
}

export function useStationJobColumns(actions: Actions, ui: UIComponents) {
  const columns: ColumnDef<StationJob>[] = [
    {
      id: 'select',
      header: ({ table }) => h(ui.UCheckbox, {
        modelValue: table.getIsAllPageRowsSelected(),
        indeterminate: table.getIsSomePageRowsSelected(),
        'onUpdate:modelValue': (v: boolean) => table.toggleAllPageRowsSelected(!!v),
        ariaLabel: 'Select all',
      }),
      cell: ({ row }) => h(ui.UCheckbox, {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (v: boolean) => row.toggleSelected(!!v),
        ariaLabel: 'Select row',
      }),
      enableSorting: false,
      enableHiding: false,
    },
    {
      header: 'No',
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: 'job_code',
      header: 'Job Code',
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.job?.job_code ?? '-'),
    },
    {
      accessorKey: 'name',
      header: 'Job Name',
      cell: ({ row }) => h('div', { class: 'truncate max-w-[220px]' }, row.original.job?.name ?? '-'),
    },
    {
      accessorKey: 'standard_time',
      header: 'Std. Time (min)',
      cell: ({ row }) => h('div', { class: 'text-center text-muted' }, row.original.job?.standard_time ?? '-'),
    },
    {
      accessorKey: 'sequence',
      header: 'Sequence',
      cell: ({ row }) => h('div', { class: 'text-center text-muted' }, row.original.sequence),
    },
    {
      accessorKey: 'mandatory',
      header: 'Mandatory',
      cell: ({ row }) => h(ui.UBadge, {
        label: row.original.mandatory ? 'Mandatory' : 'Optional',
        color: row.original.mandatory ? 'warning' : 'neutral',
        variant: 'soft',
      }),
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => h(ui.UBadge, {
        label: row.original.active ? 'Active' : 'Inactive',
        color: row.original.active ? 'success' : 'neutral',
        variant: 'soft',
      }),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => h('div', { class: 'flex justify-end' }, [
        h(ui.UDropdownMenu, {
          items: [[
            { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => actions.onEdit(row.original) },
            { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => actions.onDelete(row.original) },
          ]],
          content: { align: 'end' },
        }, () => h(ui.UButton, {
          icon: 'i-lucide-more-vertical',
          color: 'neutral',
          variant: 'ghost',
          class: 'h-8 w-8 p-0',
        })),
      ]),
    },
  ]

  return { columns }
}