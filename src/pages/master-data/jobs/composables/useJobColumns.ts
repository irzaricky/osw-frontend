import { h } from 'vue'
import type { Job } from '../../../../types/master-data/job'
import type { ColumnDef } from '@tanstack/table-core'

interface UIComponents {
  UCheckbox: any
  UButton: any
  UDropdownMenu: any
  UBadge: any
}

interface Actions {
  onEdit: (job: Job) => void
  onDelete: (job: Job) => void
}

export function useJobColumns(actions: Actions, ui: UIComponents) {
  const columns: ColumnDef<Job>[] = [
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
      header: 'Code',
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.job_code),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => h('div', { class: 'truncate max-w-[200px]' }, row.original.name),
    },
    {
      accessorKey: 'job_type',
      header: 'Type',
      cell: ({ row }) => h('div', { class: 'text-muted' }, row.original.job_type?.name ?? '-'),
    },
    {
      accessorKey: 'standard_time',
      header: 'Std. Time (m)',
      cell: ({ row }) => h('div', { class: 'text-center text-muted' }, row.original.standard_time),
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