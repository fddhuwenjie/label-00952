/**
 * 主布局组件
 */
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Space, theme, Drawer } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  OrderedListOutlined,
  TagsOutlined,
  MessageOutlined,
  RobotOutlined,
  AimOutlined,
  BellOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import useStore from '../store/useStore'
import { chatApi, notificationApi } from '../services/api'

const { Header, Sider, Content } = Layout

// 菜单配置
const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/accounts', icon: <UserOutlined />, label: '账号管理' },
  { key: '/products', icon: <ShoppingOutlined />, label: '商品管理' },
  { key: '/orders', icon: <OrderedListOutlined />, label: '订单管理' },
  { key: '/coupons', icon: <TagsOutlined />, label: '卡券管理' },
  {
    key: 'reply',
    icon: <RobotOutlined />,
    label: '自动回复',
    children: [
      { key: '/auto-replies', icon: <RobotOutlined />, label: '关键词回复' },
      { key: '/targeted-replies', icon: <AimOutlined />, label: '指定回复' },
    ],
  },
  { key: '/chat', icon: <MessageOutlined />, label: '在线聊天' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
]

function MainLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { token: { colorBgContainer } } = theme.useToken()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [drawerVisible, setDrawerVisible] = useState(false)
  
  const {
    user,
    collapsed,
    setCollapsed,
    toggleCollapsed,
    unreadMessages,
    unreadNotifications,
    setUnreadMessages,
    setUnreadNotifications,
    logout,
  } = useStore()

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setCollapsed(true)
      }
    }
    
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 获取未读数
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const [msgRes, notifyRes] = await Promise.all([
          chatApi.getUnreadCount(),
          notificationApi.getUnreadCount(),
        ])
        setUnreadMessages(msgRes.data?.count || 0)
        setUnreadNotifications(notifyRes.data?.count || 0)
      } catch (error) {
        // ignore
      }
    }
    
    fetchUnread()
    const timer = setInterval(fetchUnread, 30000)
    return () => clearInterval(timer)
  }, [])

  // 菜单点击处理
  const handleMenuClick = ({ key }) => {
    navigate(key)
    if (isMobile) {
      setDrawerVisible(false)
    }
  }

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/settings'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  // 侧边栏菜单内容
  const siderContent = (
    <>
      <div className={`logo ${collapsed && !isMobile ? 'logo-collapsed' : ''}`}>
        <span style={{ fontSize: 24 }}>🐟</span>
        {(!collapsed || isMobile) && <span className="logo-text" style={{ marginLeft: 8 }}>闲鱼管理</span>}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={['reply']}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </>
  )

  return (
    <Layout className="app-layout">
      {/* 桌面端侧边栏 */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          className="app-sider"
          width={200}
          collapsedWidth={80}
        >
          {siderContent}
        </Sider>
      )}
      
      {/* 移动端抽屉菜单 */}
      {isMobile && (
        <Drawer
          placement="left"
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          width={240}
          bodyStyle={{ padding: 0, background: '#001529' }}
          headerStyle={{ display: 'none' }}
          className="mobile-drawer"
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px' }}>
            <Button 
              type="text" 
              icon={<CloseOutlined style={{ color: '#fff' }} />} 
              onClick={() => setDrawerVisible(false)}
            />
          </div>
          {siderContent}
        </Drawer>
      )}
      
      <Layout style={{ 
        marginLeft: isMobile ? 0 : (collapsed ? 80 : 200), 
        transition: 'margin-left 0.2s' 
      }}>
        <Header className="app-header" style={{ background: colorBgContainer }}>
          <Button
            type="text"
            icon={isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            onClick={() => isMobile ? setDrawerVisible(true) : toggleCollapsed()}
            style={{ fontSize: 16 }}
          />
          
          <Space size={isMobile ? 8 : 16}>
            <Badge count={unreadMessages} size="small">
              <Button
                type="text"
                icon={<MessageOutlined />}
                onClick={() => navigate('/chat')}
              />
            </Badge>
            
            <Badge count={unreadNotifications} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                onClick={() => navigate('/notifications')}
              />
            </Badge>
            
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} size={isMobile ? 'small' : 'default'} style={{ backgroundColor: '#1677ff' }} />
                {!isMobile && (
                  <span>{user?.username || '管理员'}</span>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content className="app-content" style={{ background: 'transparent' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
