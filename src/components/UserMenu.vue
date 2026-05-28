<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import { useColorMode } from '@vueuse/core'
import { api } from '../plugins/axios'

import { useAuthStore } from '../stores/auth.store'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode({ initialValue: 'light' })
const appConfig = useAppConfig()
const authStore = useAuthStore()

const userData = computed(() => {
  return authStore.user || { email: 'Loading...', role: '' }
})

const isSuperadmin = computed(() => {
  const role = authStore.user?.role?.toLowerCase()
  const orig = authStore.user?.simulated_from?.toLowerCase()
  return role === 'superadmin' || orig === 'superadmin'
})

const rawDivisions = ref<any[]>([
  { id: 1, name: 'SALES' },
  { id: 2, name: 'WAREHOUSE' },
  { id: 3, name: 'PPIC' },
  { id: 4, name: 'PURCHASING' }
])

const rawRoles = ref<any[]>([
  { name: 'Admin sales', division_id: 1 },
  { name: 'Supervisor Sales', division_id: 1 },
  { name: 'Staff Sales Forecast', division_id: 1 },
  { name: 'Staff Sales Order', division_id: 1 },
  { name: 'Staff Sales Delivery', division_id: 1 },
  { name: 'Warehouse Staff', division_id: 2 },
  { name: 'Production Planner', division_id: 3 },
  { name: 'Driver', division_id: null }
])

const fetchSimulatedRoles = async () => {
  try {
    const [rolesRes, divisionsRes] = await Promise.all([
      api.get('/master-data/users/dd-roles'),
      api.get('/master-data/users/dd-divisi')
    ])
    if (rolesRes.data && rolesRes.data.status && Array.isArray(rolesRes.data.data)) {
      rawRoles.value = rolesRes.data.data
    }
    if (divisionsRes.data && divisionsRes.data.status && Array.isArray(divisionsRes.data.data)) {
      rawDivisions.value = divisionsRes.data.data
    }
  } catch (error) {
    console.error('Error fetching simulated roles or divisions:', error)
  }
}

watch(
  isSuperadmin,
  (newValue) => {
    if (newValue) {
      fetchSimulatedRoles()
    }
  },
  { immediate: true }
)

const colors = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

const user = computed(() => ({
  name: userData.value.email,
  avatar: {
    src: `https://ui-avatars.com/api/?name=${userData.value.email}&background=random`,
    alt: userData.value.email
  }
}))

const items = computed<DropdownMenuItem[][]>(() => {
  const list: DropdownMenuItem[][] = [[{
    type: 'label',
    slot: 'account',
    label: user.value.name,
    avatar: user.value.avatar
  }], [{
    label: 'Theme',
    icon: 'i-lucide-palette',
    children: [{
      label: 'Primary',
      slot: 'chip',
      chip: appConfig.ui.colors.primary,
      content: {
        align: 'center',
        collisionPadding: 16
      },
      children: colors.map(color => ({
        label: color,
        chip: color,
        slot: 'chip',
        checked: appConfig.ui.colors.primary === color,
        type: 'checkbox',
        onSelect: (e) => {
          e.preventDefault()

          appConfig.ui.colors.primary = color
        }
      }))
    }, {
      label: 'Neutral',
      slot: 'chip',
      chip: appConfig.ui.colors.neutral === 'neutral' ? 'old-neutral' : appConfig.ui.colors.neutral,
      content: {
        align: 'end',
        collisionPadding: 16
      },
      children: neutrals.map(color => ({
        label: color,
        chip: color === 'neutral' ? 'old-neutral' : color,
        slot: 'chip',
        type: 'checkbox',
        checked: appConfig.ui.colors.neutral === color,
        onSelect: (e) => {
          e.preventDefault()

          appConfig.ui.colors.neutral = color
        }
      }))
    }]
  }, {
    label: 'Appearance',
    icon: 'i-lucide-sun-moon',
    children: [{
      label: 'Light',
      icon: 'i-lucide-sun',
      type: 'checkbox',
      checked: colorMode.value === 'light',
      onSelect(e: Event) {
        e.preventDefault()

        colorMode.value = 'light'
      }
    }, {
      label: 'Dark',
      icon: 'i-lucide-moon',
      type: 'checkbox',
      checked: colorMode.value === 'dark',
      onSelect(e: Event) {
        e.preventDefault()

        colorMode.value = 'dark'
      }
    }]
  }]]

  if (isSuperadmin.value) {
    const currentRole = authStore.user?.role
    const currentSimulated = authStore.simulatedRole

    // Build the dynamic children list for "Simulate Role"
    const simulationChildren: DropdownMenuItem[] = [
      {
        label: 'Superadmin (Reset)',
        type: 'checkbox',
        checked: !currentSimulated,
        onSelect(e: Event) {
          e.preventDefault()
          authStore.simulateRole(null)
          window.location.href = '/'
        }
      }
    ]

    // Group roles by division
    const rolesByDivision: Record<string, any[]> = {}
    const noDivisionRoles: any[] = []

    rawRoles.value.forEach(r => {
      if (r.name.toLowerCase() === 'superadmin') return // skip superadmin since it's the Reset option

      if (r.division_id) {
        const divName = rawDivisions.value.find(d => d.id === r.division_id)?.name || `Division ${r.division_id}`
        if (!rolesByDivision[divName]) {
          rolesByDivision[divName] = []
        }
        rolesByDivision[divName].push(r)
      } else {
        noDivisionRoles.push(r)
      }
    })

    // Add grouped divisions as submenus
    Object.keys(rolesByDivision).sort().forEach(divName => {
      simulationChildren.push({
        label: divName,
        icon: 'i-lucide-folder',
        children: rolesByDivision[divName].map(r => ({
          label: r.name,
          type: 'checkbox',
          checked: currentRole === r.name,
          onSelect(e: Event) {
            e.preventDefault()
            authStore.simulateRole(r.name)
            window.location.href = '/'
          }
        }))
      })
    })

    // Add ungrouped roles directly
    if (noDivisionRoles.length > 0) {
      noDivisionRoles.forEach(r => {
        simulationChildren.push({
          label: r.name,
          type: 'checkbox',
          checked: currentRole === r.name,
          onSelect(e: Event) {
            e.preventDefault()
            authStore.simulateRole(r.name)
            window.location.href = '/'
          }
        })
      })
    }

    list[1].push({
      label: 'Simulate Role',
      icon: 'i-lucide-shield-alert',
      children: simulationChildren
    })
  }

  list.push([{
    label: 'Log out',
    icon: 'i-lucide-log-out',
    to: '/logout'
  }])

  return list
})
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...user,
        label: collapsed ? undefined : user?.name,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />

    <template #account-label="{ item }">
      <UTooltip :text="item.label" class="flex-1 truncate text-left">
        <span class="truncate block">{{ item.label }}</span>
      </UTooltip>
    </template>

    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`
          }"
        />
      </div>
    </template>
  </UDropdownMenu>
</template>
