import axios from 'axios'

const authApi = axios.create({ baseURL: '/api/sso' })

export const register = (data) => authApi.post('/register', data)
export const login = (data) => authApi.post('/login', data)
