<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

interface Props {
  isCreate:        boolean
  currentBom?:     any
  saving?:         boolean
  docStatusColor:  (code?: string) => 'neutral' | 'warning' | 'success' | 'error'
}

const props = defineProps<Props>()
const emit  = defineEmits<{
  approve:    []
  reject:     []
  activate:   []
  newVersion: []
}>()

const router = useRouter()
</script>

<template>
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="flex items-center gap-3">
      <UButton
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="router.push('/production-plan/bom')"
      />
      <div>
        <div class="flex items-center gap-2 flex-wrap">
          <h1 class="text-2xl font-bold">
            {{ isCreate ? 'New Bill of Materials' : (currentBom?.bom_number ?? '—') }}
          </h1>
          <UBadge
            v-if="!isCreate && currentBom?.bom_version"
            :label="`v${currentBom.bom_version}`"
            color="neutral"
            variant="outline"
          />
          <UBadge
            v-if="!isCreate && currentBom?.doc_status"
            :label="currentBom.doc_status.name"
            :color="docStatusColor(currentBom.doc_status.code)"
            variant="subtle"
          />
          <UBadge
            v-if="!isCreate && currentBom?.activation_status"
            :label="currentBom.activation_status.name"
            :color="currentBom.activation_status.code === 'ACTIVE' ? 'success' : 'neutral'"
            variant="soft"
          />
        </div>
        <p v-if="!isCreate && currentBom?.parent_part" class="text-sm text-muted mt-0.5">
          {{ currentBom.parent_part.part_number }} · {{ currentBom.parent_part.part_name }}
        </p>
      </div>
    </div>

    <!-- Workflow buttons (edit mode only) -->
    <div v-if="!isCreate && currentBom" class="flex items-center gap-2 flex-wrap">
      <template v-if="currentBom.doc_status?.code === 'PENDING_APPROVAL'">
        <UButton label="Approve" icon="i-lucide-check" color="success" :loading="saving" @click="emit('approve')" />
        <UButton label="Reject"  icon="i-lucide-x"    color="error"  variant="soft" :loading="saving" @click="emit('reject')" />
      </template>
      <template v-if="currentBom.doc_status?.code === 'APPROVED'">
        <UButton
          :label="currentBom.activation_status?.code === 'ACTIVE' ? 'Deactivate' : 'Activate'"
          :icon="currentBom.activation_status?.code === 'ACTIVE' ? 'i-lucide-power-off' : 'i-lucide-power'"
          :color="currentBom.activation_status?.code === 'ACTIVE' ? 'neutral' : 'success'"
          variant="soft"
          :loading="saving"
          @click="emit('activate')"
        />
        <UButton
          label="New Version"
          icon="i-lucide-copy-plus"
          color="neutral"
          variant="ghost"
          :loading="saving"
          @click="emit('newVersion')"
        />
      </template>
    </div>
  </div>
</template>