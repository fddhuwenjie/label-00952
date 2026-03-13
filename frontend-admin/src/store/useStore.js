/**
 * 全局状态管理
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      // 用户信息
      user: null,
      token: null,
      
      // hydration 状态
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      // 设置用户信息
      setUser: (user) => set({ user }),
      
      // 设置令牌
      setToken: (token) => {
        // 同步写入独立的 localStorage key
        if (token) {
          localStorage.setItem('auth-token', token)
        } else {
          localStorage.removeItem('auth-token')
        }
        set({ token })
      },
      
      // 登录
      login: (user, token) => {
        // 同步写入独立的 localStorage key，确保立即可用
        if (token) {
          localStorage.setItem('auth-token', token)
        }
        set({ user, token })
      },
      
      // 登出
      logout: () => {
        localStorage.removeItem('auth-token')
        set({ user: null, token: null })
      },
      
      // 是否已登录
      isAuthenticated: () => {
        const { token } = get()
        return !!token
      },
      
      // 侧边栏折叠状态
      collapsed: false,
      setCollapsed: (collapsed) => set({ collapsed }),
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      
      // 未读消息数
      unreadMessages: 0,
      setUnreadMessages: (count) => set({ unreadMessages: count }),
      
      // 未读通知数
      unreadNotifications: 0,
      setUnreadNotifications: (count) => set({ unreadNotifications: count }),
    }),
    {
      name: 'xianyu-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        collapsed: state.collapsed,
      }),
      onRehydrateStorage: () => (state) => {
        // hydration 完成后，同步 auth-token
        if (state?.token) {
          localStorage.setItem('auth-token', state.token)
        }
        state?.setHasHydrated(true)
      },
    }
  )
)

// 等待 hydration 完成的 hook
export const useHydration = () => {
  return useStore((state) => state._hasHydrated)
}

export default useStore
