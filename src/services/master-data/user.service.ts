import { api } from '../../plugins/axios'
import type { User } from '../../types/master-data/user'

export interface UserParams {
  page?: number
  limit?: number
  search?: string
  role_id?: number
  factory_id?: number
  line_id?: number
  [key: string]: any
}

const userService = {
  getUsers(params?: UserParams) {
    return api.get('/master-data/users/', { params })
  },

  getUserById(id: number | string) {
    return api.get(`/master-data/users/${id}`)
  },

  createUser(data: Partial<User>) {
    return api.post('/master-data/users/', data)
  },

  updateUser(id: number | string, data: Partial<User>) {
    return api.put(`/master-data/users/${id}`, data)
  },
  
  updateUserStatus(id: number | string, active: boolean) {
    return api.patch(`/master-data/users/status/${id}`, { active })
  },

  deleteUser(id: number | string) {
    return api.delete(`/master-data/users/${id}`)
  },

  getRoles() {
    return api.get('/master-data/users/dd-roles')
  },

  getDivisions() {
    return api.get('/master-data/users/dd-divisi')
  },
  
  getStatuses() {
    return api.get('/master-data/users/dd-status')
  },

  getFactories() {
    return api.get('/master-data/users/dd-factory')
  },

  getLines(factoryId?: number | string) {
    const params = factoryId ? { factory_id: factoryId } : {}
    return api.get('/master-data/users/dd-lines', { params })
  },

  downloadUsers(params?: UserParams) {
    return api.get('/master-data/users/download', { params, responseType: 'blob' })
  }
}

export default userService
