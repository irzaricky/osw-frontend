import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStorage } from '@vueuse/core'
import authService from '../services/auth.service'

interface User {
  id: number
  username: string
  email: string
  role?: string
  [key: string]: any
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  
  // State
  const token = useStorage<string | null>('auth_token', null)
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const simulatedRole = useStorage<string | null>('simulated_role', null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)

  // Actions
  async function login(credentials: any) {
    loading.value = true
    error.value = null
    
    try {
      const response = await authService.login(credentials)
      const data = response.data

      if (data.status && data.data.token) {
        token.value = data.data.token
        await fetchProfile()
        
        // Redirect to dashboard or previous page
        const redirectPath = router.currentRoute.value.query.redirect as string || '/'
        router.push(redirectPath)
      } else {
        throw new Error(data.message || 'Login failed')
      }
    } catch (e: any) {
      error.value = e.response?.data?.message ||e.response?.data?.error || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
        if (token.value) {
            await authService.logout()
        }
    } catch (e) {
        console.error('Logout error', e)
    } finally {
        token.value = null
        user.value = null
        simulatedRole.value = null
        router.push('/login')
    }
  }

  async function fetchProfile() {
    if (!token.value) return

    loading.value = true
    try {
      const response = await authService.fetchProfile()
      const data = response.data
      
      if (data.status) {
        user.value = data.data
        if (user.value && (user.value.role?.toLowerCase() === 'superadmin' || user.value.simulated_from?.toLowerCase() === 'superadmin') && simulatedRole.value) {
          user.value.simulated_from = 'Superadmin'
          user.value.role = simulatedRole.value
        }
      } else {
        token.value = null
        user.value = null
        simulatedRole.value = null
      }
    } catch (e) {
      console.error('Fetch profile error', e)
      token.value = null
      user.value = null
      simulatedRole.value = null
    } finally {
      loading.value = false
    }
  }

  function simulateRole(roleName: string | null) {
    simulatedRole.value = roleName
    if (user.value) {
      const originalRole = user.value.simulated_from || user.value.role
      if (originalRole?.toLowerCase() === 'superadmin') {
        user.value.simulated_from = 'Superadmin'
        if (roleName) {
          user.value.role = roleName
        } else {
          user.value.role = 'Superadmin'
          delete user.value.simulated_from
          simulatedRole.value = null
        }
      }
    }
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    fetchProfile,
    simulatedRole,
    simulateRole
  }
})
