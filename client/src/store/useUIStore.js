import { create } from "zustand";

const useUIStore = create((set) => ({
  sidebarOpen: true,
  activeModal: null,
  unreadMessagesCount: 0,
  notifications: [],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveModal: (modalName) => set({ activeModal: modalName }),
  setUnreadMessagesCount: (count) => set({ unreadMessagesCount: count }),

  addNotification: (notif) => set((state) => {
    // avoid duplicate by id
    const exists = state.notifications.some(n => n.id === notif.id)
    if (exists) return {}
    return {
      notifications: [{ ...notif, read: false, ts: Date.now() }, ...state.notifications].slice(0, 20),
    }
  }),

  markNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),

  clearNotifications: () => set({ notifications: [] }),
}));

export default useUIStore;
