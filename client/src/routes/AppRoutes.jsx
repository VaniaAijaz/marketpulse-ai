import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AuthGuard from "../middleware/authGuard.jsx";
import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardHome from "../pages/dashboard/DashboardHome";
import Users from "../pages/dashboard/Users";
import Orders from "../pages/dashboard/Orders";
import Payments from "../pages/dashboard/Payments";
import ShopDetail from "../pages/dashboard/ShopDetail";
import Inventory from "../pages/dashboard/Inventory";
import InventoryHub from "../pages/dashboard/InventoryHub";
import Analytics from "../pages/dashboard/Analytics";
import AIAgent from "../pages/dashboard/AIAgent";
import Settings from "../pages/dashboard/Settings";
import WhatsApp from "../pages/dashboard/WhatsApp";
import useAuthStore from "../store/useAuthStore";
import { useShopsByOwner } from "../features/shops/shopHooks";
import Contact from "@/pages/public/Contact";
import HomeDefault from "@/pages/public/HomeDefault";
import Profile from "@/pages/public/Profile";
import ProductFullwidth from "@/pages/public/ProductFullwidth";

// Redirect /dashboard/shops → active shop's detail page
function ShopsRedirect() {
  const navigate    = useNavigate()
  const activeShop  = useAuthStore((s) => s.activeShop)
  const setActiveShop = useAuthStore((s) => s.setActiveShop)
  const user        = useAuthStore((s) => s.user)
  const { data, isLoading } = useShopsByOwner(user?._id)
  const shops = data?.data || []

  useEffect(() => {
    if (activeShop?._id) {
      navigate(`/dashboard/shops/${activeShop._id}`, { replace: true })
      return
    }
    if (!isLoading && shops.length > 0) {
      setActiveShop(shops[0])
      navigate(`/dashboard/shops/${shops[0]._id}`, { replace: true })
    }
  }, [activeShop?._id, isLoading, shops.length])

  // Show nothing while redirecting
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: '#1390ff' }} />
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
       <Route path="/home" element={<HomeDefault />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/profile" element={<Profile/>} />
      <Route path="/products" element={<ProductFullwidth />} />

      {/* Protected Dashboard */}
      <Route
        path="/dashboard"
        element={
          <AuthGuard>
            <DashboardLayout />
          </AuthGuard>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="users" element={<Users />} />
        <Route path="orders" element={<Orders />} />
        <Route path="payments" element={<Payments />} />
        <Route path="shops" element={<ShopsRedirect />} />
        <Route path="shops/:shopId" element={<ShopDetail />} />
        <Route path="shops/:shopId/inventory" element={<Inventory />} />
        <Route path="inventory" element={<InventoryHub />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="ai-agent" element={<AIAgent />} />
        <Route path="whatsapp" element={<WhatsApp />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
