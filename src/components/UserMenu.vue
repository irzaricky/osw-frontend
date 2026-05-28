<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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

const rolesList = ref<{ label: string; value: string | null }[]>([
  { label: 'Superadmin (Reset)', value: null },
  { label: 'Sales Staff', value: 'Sales Staff' },
  { label: 'Supervisor Sales', value: 'Supervisor Sales' },
  { label: 'Warehouse Staff', value: 'Warehouse Staff' },
  { label: 'Production Planner', value: 'Production Planner' },
  { label: 'Driver', value: 'Driver' }
])

onMounted(async () => {
  if (isSuperadmin.value) {
    try {
      const response = await api.get('/master-data/users/dd-roles')
      if (response.data && response.data.status && Array.isArray(response.data.data)) {
        const fetchedRoles = response.data.data
          .filter((r: any) => r.name.toLowerCase() !== 'superadmin')
          .map((r: any) => ({
            label: r.name,
            value: r.name
          }))
        rolesList.value = [
          { label: 'Superadmin (Reset)', value: null },
          ...fetchedRoles
        ]
      }
    } catch (error) {
      console.error('Error fetching simulated roles:', error)
      rolesList.value = [
        { label: 'Superadmin (Reset)', value: null },
        { label: 'Admin sales', value: 'Admin sales' },
        { label: 'Supervisor Sales', value: 'Supervisor Sales' },
        { label: 'Staff Sales Forecast', value: 'Staff Sales Forecast' },
        { label: 'Staff Sales Order', value: 'Staff Sales Order' },
        { label: 'Staff Sales Delivery', value: 'Staff Sales Delivery' },
        { label: 'Warehouse Staff', value: 'Warehouse Staff' },
        { label: 'Production Planner', value: 'Production Planner' },
        { label: 'Driver', value: 'Driver' }
      ]
    }
  }
})

const colors = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

const userData = computed(() => {
  return authStore.user || { email: 'Loading...', role: '' }
})

const isSuperadmin = computed(() => {
  const role = authStore.user?.role?.toLowerCase()
  const orig = authStore.user?.simulated_from?.toLowerCase()
  return role === 'superadmin' || orig === 'superadmin'
})

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

    list[1].push({
      label: 'Simulate Role',
      icon: 'i-lucide-shield-alert',
      children: rolesList.value.map(r => ({
        label: r.label,
        type: 'checkbox',
        checked: r.value === null ? (!currentSimulated) : (currentRole === r.value),
        onSelect(e: Event) {
          e.preventDefault()
          authStore.simulateRole(r.value)
          window.location.href = '/'
        }
      }))
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
