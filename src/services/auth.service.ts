import { api } from '../plugins/axios'

interface LoginCredentials {
  username: string
  password?: string
  [key: string]: any
}

const authService = {
  login(credentials: LoginCredentials) {
    return api.post('/auth/login', credentials)
  },

  logout() {
    return api.post('/auth/logout')
  },

  fetchProfile() {
    return api.get('/auth/me')
  }
}

export default authService
