import { create } from "zustand";

const useUIStore = create((set) => ({
  sidebarOpen: true,
  activeModal: null, // 'add-shop' | 'add-customer' | 'create-order' | 'upgrade-plan' | null
  unreadMessagesCount: 2,
  notifications: [
    { id: 1, text: "Gemini 1.5 Flash limit reset in 12 hours", read: false },
    { id: 2, text: "Payment successfully processed for Plan upgrade", read: false }
  ],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveModal: (modalName) => set({ activeModal: modalName }),
  setUnreadMessagesCount: (count) => set({ unreadMessagesCount: count }),
  markNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  }))
}));

export default useUIStore;
