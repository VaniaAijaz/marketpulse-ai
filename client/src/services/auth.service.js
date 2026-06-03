import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('token')

    set({
      user: null,
      token: null,
    })
  },
}))

export default useAuthStore