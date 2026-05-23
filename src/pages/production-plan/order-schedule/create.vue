<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import { useOrderScheduleStore } from '../../../stores/production-plan/order-schedule.store'
import { useAppToast } from '../../../composables/useAppToast'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import OrderScheduleForm from './components/PoForm.vue'

// ── Init ───────────────────────────────────────────────────────────────────────
const router = useRouter()
const store  = useOrderScheduleStore()
const { saving } = storeToRefs(store)
const { toastSuccess, toastError } = useAppToast()

// ── Breadcrumbs ────────────────────────────────────────────────────────────────
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Production Plan' },
  { label: 'Production Order', to: '/production-plan/order-schedule' },
  { label: 'Create' },
]

// ── Handlers ───────────────────────────────────────────────────────────────────
async function handleSave(payload: { type: 'draft' | 'submit'; data: any }) {
  try {
    const res = await store.createOrder(payload.data)
    if (res?.status) {
      const newId = res.data?.id
      toastSuccess(res.message || 'Production order created successfully.')

      if (payload.type === 'submit' && newId) {
        await store.submit(newId)
        toastSuccess('Production order submitted for approval.')
      }

      router.push(newId ? `/production-plan/order-schedule/${newId}` : '/production-plan/order-schedule')
    }
  } catch (err) {
    toastError(err)
  }
}

function handleCancel() {
  router.push('/production-plan/order-schedule')
}
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex items-center gap-4">
      <!-- Back Button -->
      <UButton
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="soft"
        size="sm"
        @click="$router.back()"
      />
      <div>
        <h1 class="text-2xl font-bold">Create Production Order</h1>
        <p class="text-sm text-muted mt-0.5">Select an approved production plan and set the production schedule range.</p>
      </div>
    </div>

    <OrderScheduleForm
      mode="create"
      :loading="saving"
      @save="handleSave"
      @cancel="handleCancel"
    />
  </div>
</template>