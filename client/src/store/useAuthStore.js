import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token") || null,
  activeShop: JSON.parse(localStorage.getItem("activeShop") || "null"),

  /** Login payload from API: { _id, phone, email, businessType, shopId, shop, token } */
  login: (data) => {
    const { shop, token, ...user } = data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    if (shop) {
      localStorage.setItem("activeShop", JSON.stringify(shop));
      set({ user, token, activeShop: shop });
    } else {
      set({ user, token });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeShop");
    set({ user: null, token: null, activeShop: null });
  },

  updateUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },

  setActiveShop: (shop) => {
    localStorage.setItem("activeShop", JSON.stringify(shop));
    set({ activeShop: shop });
  },
}));

export default useAuthStore;
