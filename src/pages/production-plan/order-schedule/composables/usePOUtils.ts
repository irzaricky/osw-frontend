import type { POStatus, POPriority, ScheduleStatus } from '../../../../types/production-plan/order-schedule'

export const poStatusLabel: Record<POStatus, string> = {
  Draft:            'Draft',
  Pending_Approval: 'Pending Approval',
  Approved:         'Approved',
  Released:         'Released',
  Rejected:         'Rejected',
}

export const poStatusColor: Record<POStatus, 'neutral' | 'info' | 'warning' | 'success' | 'error'> = {
  Draft:            'neutral',
  Pending_Approval: 'warning',
  Approved:         'info',
  Released:         'success',
  Rejected:         'error',
}

export const priorityColor: Record<POPriority, 'neutral' | 'info' | 'warning' | 'error'> = {
  Low:    'neutral',
  Medium: 'info',
  High:   'warning',
}

export const priorityOptions: { label: string; value: POPriority }[] = [
  { label: 'Low',    value: 'Low'    },
  { label: 'Medium', value: 'Medium' },
  { label: 'High',   value: 'High'   },
]

export const STATUS_OPTIONS: POStatus[] = [
  'Draft', 'Pending_Approval', 'Approved', 'Released', 'Rejected',
]

export function fmtDate(d?: string | null): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtNum(n?: number | null): string {
  if (n == null) return '-'
  return n.toLocaleString('en-US')
}

export function scheduledPct(planned: number, scheduled: number): number {
  if (!planned) return 0
  return Math.min(100, Math.round((scheduled / planned) * 100))
}

export function utilClass(pct?: number | null): string {
  if (pct == null) return 'text-muted'
  if (pct > 100)   return 'text-error-600 dark:text-error-400 font-bold'
  if (pct > 80)    return 'text-warning-600 dark:text-warning-400 font-semibold'
  return 'text-success-600 dark:text-success-400'
}

export function schedBadgeColor(status: ScheduleStatus): 'success' | 'error' | 'warning' | 'neutral' {
  if (status === 'Completed')   return 'success'
  if (status === 'Cancelled')   return 'error'
  if (status === 'In_Progress') return 'warning'
  return 'neutral'
}

export function isWeekend(d: string): boolean {
  const day = new Date(d).getDay()
  return day === 0 || day === 6
}

export function dateRangeColumns(startDate: string, endDate: string): string[] {
  const cols: string[] = []
  if (!startDate || !endDate) return cols
  const cur = new Date(startDate)
  const end = new Date(endDate)
  while (cur <= end) {
    cols.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return cols
}