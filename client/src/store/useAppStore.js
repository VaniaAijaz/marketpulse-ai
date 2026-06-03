import { create } from "zustand";

const useAppStore = create((set) => ({
  shops: [],
  events: [
    { id: 1, time: "10:42", type: "person_add",    message: "New customer Ali Khan registered." },
    { id: 2, time: "10:38", type: "shopping_cart", message: "Order #8921 placed — Rs.4,200." },
    { id: 3, time: "10:30", type: "shopping_cart", message: "Order #8920 placed — Rs.1,150." },
    { id: 4, time: "10:28", type: "person_add",    message: "New customer Sara Ahmed registered." },
    { id: 5, time: "10:15", type: "warning",       message: "Payment failed for Order #8919." },
  ],

  setShops: (shops) => set({ shops }),
  
  addEvent: (event) => set((state) => ({
    events: [
      {
        id: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...event
      },
      ...state.events.slice(0, 19) // Limit to 20 events
    ]
  })),

  clearEvents: () => set({ events: [] })
}));

export default useAppStore;
