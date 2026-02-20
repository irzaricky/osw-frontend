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
    label: 'Warehouses',
    to: '/master-data/warehouses',
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
  }]
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
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'simple-icons:github',
    to: `https://github.com/nuxt-ui-templates/dashboard-vue/blob/main/src/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
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
        <TeamsMenu :collapsed="collapsed" />
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