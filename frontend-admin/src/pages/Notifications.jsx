/**
 * 消息通知页面
 */
import { useState, useEffect } from 'react'
import { Card, List, Button, Empty, Spin, Tag, Space, message } from 'antd'
import { CheckOutlined, DeleteOutlined, BellOutlined } from '@ant-design/icons'
import { notificationApi } from '../services/api'
import useStore from '../store/useStore'
import dayjs from 'dayjs'

const typeMap = {
  order: { text: '订单', color: 'blue' },
  stock: { text: '库存', color: 'orange' },
  error: { text: '异常', color: 'red' },
  system: { text: '系统', color: 'default' },
}

function Notifications() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const setUnreadNotifications = useStore((state) => state.setUnreadNotifications)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (page = 1) => {
    setLoading(true)
    try {
      const res = await notificationApi.getList({ page, per_page: 20 })
      setData(res.data || [])
      setPagination({
        current: res.pagination?.page || 1,
        pageSize: res.pagination?.per_page || 20,
        total: res.pagination?.total || 0,
      })
    } catch (error) {}
    setLoading(false)
  }

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id)
      fetchData(pagination.current)
      updateUnreadCount()
    } catch (error) {}
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      message.success('已全部标记为已读')
      fetchData(pagination.current)
      updateUnreadCount()
    } catch (error) {}
  }

  const handleDelete = async (id) => {
    try {
      await notificationApi.delete(id)
      message.success('删除成功')
      fetchData(pagination.current)
      updateUnreadCount()
    } catch (error) {}
  }

  const updateUnreadCount = async () => {
    try {
      const res = await notificationApi.getUnreadCount()
      setUnreadNotifications(res.data?.count || 0)
    } catch (error) {}
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 16 : 24, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0 }}>消息通知</h2>
        <Button onClick={handleMarkAllAsRead} size={isMobile ? 'small' : 'middle'}>
          <CheckOutlined /> 全部已读
        </Button>
      </div>

      <Card bodyStyle={{ padding: isMobile ? 12 : 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: isMobile ? 40 : 60 }}><Spin size="large" /></div>
        ) : data.length === 0 ? (
          <Empty description="暂无通知" style={{ padding: isMobile ? 40 : 60 }} />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={data}
            pagination={{
              ...pagination,
              size: isMobile ? 'small' : 'default',
              onChange: (page) => fetchData(page),
            }}
            renderItem={(item) => (
              <List.Item
                style={{
                  backgroundColor: item.is_read ? 'transparent' : '#f6ffed',
                  padding: isMobile ? '12px' : '16px 24px',
                  marginBottom: 8,
                  borderRadius: 8,
                }}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: isMobile ? 32 : 40,
                      height: isMobile ? 32 : 40,
                      borderRadius: '50%',
                      flexShrink: 0,
                      backgroundColor: typeMap[item.type]?.color === 'blue' ? '#e6f4ff' :
                        typeMap[item.type]?.color === 'orange' ? '#fff7e6' :
                        typeMap[item.type]?.color === 'red' ? '#fff1f0' : '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <BellOutlined style={{
                        fontSize: isMobile ? 14 : 16,
                        color: typeMap[item.type]?.color === 'blue' ? '#1677ff' :
                          typeMap[item.type]?.color === 'orange' ? '#fa8c16' :
                          typeMap[item.type]?.color === 'red' ? '#ff4d4f' : '#8c8c8c',
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: item.is_read ? 400 : 600, fontSize: isMobile ? 13 : 14 }}>{item.title}</span>
                        <Tag color={typeMap[item.type]?.color}>{typeMap[item.type]?.text || item.type}</Tag>
                        {!item.is_read && <Tag color="success">新</Tag>}
                      </div>
                      {item.content && <div style={{ marginBottom: 4, fontSize: isMobile ? 12 : 14, color: '#666' }}>{item.content}</div>}
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {dayjs(item.created_at).format(isMobile ? 'MM-DD HH:mm' : 'YYYY-MM-DD HH:mm:ss')}
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
                        {!item.is_read && (
                          <Button type="link" size="small" onClick={() => handleMarkAsRead(item.id)} style={{ padding: 0, height: 'auto' }}>
                            标为已读
                          </Button>
                        )}
                        <Button type="link" size="small" danger onClick={() => handleDelete(item.id)} style={{ padding: 0, height: 'auto' }}>
                          删除
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  )
}

export default Notifications
