<script setup lang="ts">
interface Props {
  currentBom: any
  detailCount: number
  fmtDate: (d?: string | null) => string
}

defineProps<Props>()
</script>

<template>
  <div class="rounded-xl border border-default bg-elevated grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-px overflow-hidden">
    <div class="bg-default p-4 space-y-1">
      <p class="text-xs text-muted">BOM Number</p>
      <p class="text-sm font-semibold font-mono">{{ currentBom.bom_number }}</p>
    </div>
    <div class="bg-default p-4 space-y-1">
      <p class="text-xs text-muted">Version</p>
      <p class="text-sm font-semibold">{{ currentBom.bom_version }}</p>
    </div>
    <div class="bg-default p-4 space-y-1">
      <p class="text-xs text-muted">UOM</p>
      <p class="text-sm font-semibold font-mono uppercase">{{ currentBom.uom?.name ?? '—' }}</p>
    </div>
    <div class="bg-default p-4 space-y-1">
      <p class="text-xs text-muted">Components</p>
      <p class="text-sm font-semibold">{{ detailCount }}</p>
    </div>
    <div class="bg-default p-4 space-y-1">
      <p class="text-xs text-muted">Created By</p>
      <p class="text-sm font-semibold">{{ currentBom.creator?.email ?? '—' }}</p>
    </div>
    <div class="bg-default p-4 space-y-1">
      <p class="text-xs text-muted">Approved By</p>
      <p class="text-sm font-semibold">
        {{ currentBom.approver?.email ?? '—' }}
        <span v-if="currentBom.approved_at" class="block text-xs text-muted font-normal">
          {{ fmtDate(currentBom.approved_at) }}
        </span>
      </p>
    </div>
  </div>
</template>