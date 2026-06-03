import { useEffect } from 'react'
import useAuthStore from '../store/useAuthStore'
import { useShopsByOwner } from '../features/shops/shopHooks'

/** Ensures activeShop is set after login (single-shop accounts). */
export function useBootstrapShop() {
  const user = useAuthStore((s) => s.user)
  const activeShop = useAuthStore((s) => s.activeShop)
  const setActiveShop = useAuthStore((s) => s.setActiveShop)
  const { data: shopsRes } = useShopsByOwner(user?._id)

  useEffect(() => {
    if (activeShop?._id) return
    const shops = shopsRes?.data || []
    if (shops.length > 0) setActiveShop(shops[0])
  }, [activeShop?._id, shopsRes, setActiveShop])
}
