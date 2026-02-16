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
      } else {
        // Token might be invalid
        token.value = null
        user.value = null
      }
    } catch (e) {
      console.error('Fetch profile error', e)
      // If error is 401, interceptor handles it, but we should also clear state
      token.value = null
      user.value = null
    } finally {
      loading.value = false
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
    fetchProfile
  }
})
