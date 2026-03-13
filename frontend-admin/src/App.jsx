/**
 * 应用主组件
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import useStore, { useHydration } from './store/useStore'
import MainLayout from './components/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Products from './pages/Products'
import Orders from './pages/Orders'
import Coupons from './pages/Coupons'
import AutoReplies from './pages/AutoReplies'
import TargetedReplies from './pages/TargetedReplies'
import Chat from './pages/Chat'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'

// 路由守卫组件
function PrivateRoute({ children }) {
  const token = useStore((state) => state.token)
  const hasHydrated = useHydration()
  
  // 等待 hydration 完成
  if (!hasHydrated) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Spin size="large" />
      </div>
    )
  }
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/coupons" element={<Coupons />} />
                  <Route path="/auto-replies" element={<AutoReplies />} />
                  <Route path="/targeted-replies" element={<TargetedReplies />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MainLayout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
