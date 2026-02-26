<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const open = ref(false)

const links = [[{
  label: 'Home',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Master Data',
  icon: 'i-lucide-database',
  defaultOpen: true,
  children: [{
    label: 'Users',
    to: '/master-data/users',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Vehicles',
    to: '/master-data/vehicles',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Defects',
    to: '/master-data/defects',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Warehouses',
    to: '/master-data/warehouses',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Warehouse Areas',
    to: '/master-data/warehouse-areas',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Docks',
    to: '/master-data/docks',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Audit Logs',
    to: '/master-data/audit-logs',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Customers',
    to: '/master-data/customers',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Factories',
    to: '/master-data/factories',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Lines',
    to: '/master-data/lines',
    onSelect: () => {
      open.value = false
    }
  }
]
}, {
  label: 'Sales',
  icon: 'i-lucide-shopping-cart',
  to: '/sales',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Production Plan',
  icon: 'i-lucide-calendar',
  to: '/production-plan',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Warehouse',
  icon: 'i-lucide-box',
  to: '/warehouse',
  onSelect: () => {
    open.value = false
  }
}], []] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}])
</script>

<template>
  <UDashboardGroup unit="rem" storage="local">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-3" :class="collapsed ? 'justify-center p-2' : 'px-2 py-2'">
          <UAvatar src="https://github.com/vuejs.png" alt="Vue Logo" size="sm" class="shrink-0" />
          <span v-if="!collapsed" class="font-bold text-[15px] truncate text-gray-900 dark:text-white">OSW SYSTEM</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <main class="flex-1 min-w-0 w-full h-full overflow-y-auto">
      <slot />
    </main>
  </UDashboardGroup>
</template>