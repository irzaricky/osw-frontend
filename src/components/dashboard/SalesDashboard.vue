<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth.store'

const authStore = useAuthStore()

const isSupervisor = computed(() => {
  const r = authStore.user?.role?.toLowerCase()
  return r === 'superadmin' || r === 'supervisor sales'
})

const quickLinks = [
  { title: 'Create SPR', description: 'Sales Purchase Request', icon: 'i-lucide-file-text', to: '/sales' },
  { title: 'Create SPO', description: 'Sales Purchase Order', icon: 'i-lucide-file-check', to: '/sales/spo' },
  { title: 'Delivery Plan', description: 'Schedule Deliveries (SDP)', icon: 'i-lucide-calendar-days', to: '/sales/sdp' },
  { title: 'Delivery Order', description: 'Execute Deliveries (SDO)', icon: 'i-lucide-truck', to: '/sales/sdo' }
]
</script>

<template>
  <div class="p-6 space-y-8 animate-fade-in max-w-7xl mx-auto">
    <!-- Welcome Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black tracking-tight text-default">
          Welcome back, {{ authStore.user?.name || 'User' }}
        </h1>
        <p class="text-sm text-muted-foreground mt-1">
          Here is what's happening in the Sales subsystem today.
        </p>
      </div>
      <UBadge
        color="primary"
        variant="subtle"
        size="lg"
        class="capitalize font-bold px-3"
      >
        Role: {{ authStore.user?.role }}
      </UBadge>
    </div>

    <!-- Supervisor Pending Actions -->
    <div v-if="isSupervisor" class="space-y-4">
      <h2 class="text-sm font-bold text-default flex items-center gap-2 uppercase tracking-wider">
        <UIcon name="i-lucide-clipboard-list" class="w-4 h-4 text-warning" />
        Needs Review
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <RouterLink to="/sales">
          <div class="bg-warning/10 border border-warning/20 hover:border-warning/50 rounded-2xl p-5 transition-all cursor-pointer group">
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <span class="text-xs font-bold text-warning uppercase tracking-wider">Pending SPR</span>
                <h3 class="text-lg font-black text-default group-hover:text-warning transition-colors">
                  Review Requests
                </h3>
              </div>
              <UIcon name="i-lucide-file-search" class="w-8 h-8 text-warning/50 group-hover:text-warning transition-colors" />
            </div>
          </div>
        </RouterLink>

        <RouterLink to="/sales/sdo">
          <div class="bg-primary/5 border border-primary/20 hover:border-primary/50 rounded-2xl p-5 transition-all cursor-pointer group">
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <span class="text-xs font-bold text-primary uppercase tracking-wider">Pending Dispatch</span>
                <h3 class="text-lg font-black text-default group-hover:text-primary transition-colors">
                  Approve SDOs
                </h3>
              </div>
              <UIcon name="i-lucide-truck-fast" class="w-8 h-8 text-primary/50 group-hover:text-primary transition-colors" />
            </div>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Quick Links -->
    <div class="space-y-4">
      <h2 class="text-sm font-bold text-default flex items-center gap-2 uppercase tracking-wider">
        <UIcon name="i-lucide-zap" class="w-4 h-4 text-success" />
        Quick Actions
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RouterLink v-for="link in quickLinks" :key="link.title" :to="link.to">
          <div class="bg-elevated border border-default hover:border-primary/50 hover:shadow-md rounded-2xl p-5 transition-all cursor-pointer group h-full">
            <UIcon :name="link.icon" class="w-6 h-6 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
            <h3 class="font-bold text-default group-hover:text-primary transition-colors">
              {{ link.title }}
            </h3>
            <p class="text-xs text-muted-foreground mt-1">
              {{ link.description }}
            </p>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
