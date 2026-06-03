import api from "../../lib/axios";

export const loginUser = (data) => api.post("/auth/login", data);
export const registerUser = (data) => api.post("/auth/register", data);
export const registerWithShop = (data) => api.post("/auth/register-with-shop", data);
export const verifyOTP = (data) => api.post("/auth/verify-otp", data);
export const getProfile = () => api.get("/auth/profile");
export const updateProfile = (data) => api.put("/auth/profile", data);
