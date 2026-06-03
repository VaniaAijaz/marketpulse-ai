import api from '../../lib/axios'

export const getCities = () => api.get('/location/cities')
export const getAreas = (cityId) => api.get(`/location/areas/${cityId}`)
export const resolveLocation = (body) => api.post('/location/resolve', body)
