import { defineStore } from 'pinia'
import { ref } from 'vue'
import userService, { type UserParams } from '../../services/master-data/user.service'
import type { User } from '../../types/master-data/user'

export const useUserStore = defineStore('user', () => {
  // State
  const users = ref<User[]>([])
  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchUsers(params: UserParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await userService.getUsers(params)
      const data = response.data
      if (data.status) {
        users.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching users:', e)
    } finally {
      loading.value = false
    }
  }

  async function createUser(userData: Partial<User>) {
    loading.value = true
    error.value = null
    try {
      const response = await userService.createUser(userData)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateUser(id: number | string, userData: Partial<User>) {
    loading.value = true
    error.value = null
    try {
      const response = await userService.updateUser(id, userData)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }
  
  async function updateUserStatus(id: number | string, active: boolean) {
    loading.value = true
    error.value = null
    try {
      const response = await userService.updateUserStatus(id, active)
      // Optimistic update
      const userIndex = users.value.findIndex(u => u.id === id)
      if (userIndex !== -1) {
        users.value[userIndex].active = active
      }
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteUser(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await userService.deleteUser(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function downloadUsers(params: UserParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await userService.downloadUsers(params)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    meta,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser,
    downloadUsers
  }
})
