/**
 * 在线聊天页面
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Card, List, Avatar, Input, Button, Empty, Badge, Spin, Space, Popover,
} from 'antd'
import { SendOutlined, ThunderboltOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { chatApi } from '../services/api'
import useStore from '../store/useStore'
import dayjs from 'dayjs'

function Chat() {
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [currentSession, setCurrentSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [quickReplies, setQuickReplies] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showChatArea, setShowChatArea] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const { setUnreadMessages } = useStore()

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchSessions()
    fetchQuickReplies()
  }, [])

  useEffect(() => {
    if (currentSession) {
      fetchMessages(currentSession.id)
      if (isMobile) {
        setShowChatArea(true)
      }
    }
  }, [currentSession?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchSessions = async () => {
    setSessionsLoading(true)
    try {
      const res = await chatApi.getSessions({ per_page: 50 })
      setSessions(res.data || [])
    } catch (error) {}
    setSessionsLoading(false)
  }

  const fetchMessages = async (sessionId) => {
    setMessagesLoading(true)
    try {
      const res = await chatApi.getMessages(sessionId, { per_page: 100 })
      setMessages((res.data || []).reverse())
      
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, unread_count: 0 } : s
      ))
      
      setTimeout(async () => {
        try {
          const unreadRes = await chatApi.getUnreadCount()
          setUnreadMessages(unreadRes.data?.count || 0)
        } catch (e) {}
      }, 100)
    } catch (error) {}
    setMessagesLoading(false)
  }

  const fetchQuickReplies = async () => {
    try {
      const res = await chatApi.getQuickReplies()
      setQuickReplies(res.data || [])
    } catch (error) {}
  }

  const handleSend = async () => {
    if (!inputValue.trim() || !currentSession) return

    const contentToSend = inputValue.trim()
    setInputValue('')
    setSending(true)
    
    try {
      await chatApi.sendMessage(currentSession.id, { content: contentToSend })
      fetchMessages(currentSession.id)
      fetchSessions()
    } catch (error) {
      setInputValue(contentToSend)
    }
    setSending(false)
  }

  const handleQuickReply = (content) => {
    setInputValue(content)
    inputRef.current?.focus()
  }

  const handleBackToSessions = () => {
    setShowChatArea(false)
    setCurrentSession(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
  }

  const quickReplyContent = useMemo(() => (
    <div style={{ maxWidth: 300, maxHeight: 300, overflow: 'auto' }}>
      <List
        size="small"
        dataSource={quickReplies}
        renderItem={(item) => (
          <List.Item
            style={{ cursor: 'pointer', padding: '8px 12px' }}
            onClick={() => handleQuickReply(item.content)}
          >
            <span style={{ fontSize: 12 }}>{item.name}</span>
          </List.Item>
        )}
      />
    </div>
  ), [quickReplies])

  const renderSessionList = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 500 }}>
        会话列表
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {sessionsLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
        ) : sessions.length === 0 ? (
          <Empty description="暂无会话" style={{ marginTop: 40 }} />
        ) : (
          <List
            dataSource={sessions}
            renderItem={(item) => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: currentSession?.id === item.id ? '#e6f4ff' : 'transparent',
                }}
                onClick={() => setCurrentSession(item)}
              >
                <List.Item.Meta
                  avatar={
                    <Badge count={item.unread_count} size="small">
                      <Avatar style={{ backgroundColor: '#1677ff' }}>
                        {(item.buyer_name || item.buyer_id || '?')[0]}
                      </Avatar>
                    </Badge>
                  }
                  title={
                    <span style={{ fontSize: 14 }}>
                      {item.buyer_name || item.buyer_id || '未知用户'}
                    </span>
                  }
                  description={
                    <div style={{ fontSize: 12, color: '#999' }}>
                      <div style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.last_message || '暂无消息'}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        {item.last_message_at ? dayjs(item.last_message_at).format('MM-DD HH:mm') : ''}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  )

  const renderChatArea = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {currentSession ? (
        <>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            {isMobile && (
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBackToSessions} style={{ marginLeft: -8 }} />
            )}
            <div>
              {currentSession.buyer_name || currentSession.buyer_id || '未知用户'}
              <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>
                ({currentSession.account_name || '账号'})
              </span>
            </div>
          </div>

          <div className="chat-messages" style={{ flex: 1, overflow: 'auto', padding: isMobile ? '12px' : '16px' }}>
            {messagesLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
            ) : messages.length === 0 ? (
              <Empty description="暂无消息" />
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-item ${msg.sender_type === 'seller' ? 'self' : ''}`}
                >
                  <div className="message-bubble">
                    <div>{msg.content}</div>
                    <div style={{
                      fontSize: 11,
                      color: msg.sender_type === 'seller' ? 'rgba(255,255,255,0.7)' : '#999',
                      marginTop: 4,
                    }}>
                      {dayjs(msg.created_at).format('HH:mm')}
                      {msg.is_auto_reply === 1 && (
                        <span style={{ marginLeft: 4 }}>(自动)</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input" style={{ padding: isMobile ? '8px 12px' : '12px 16px', paddingBottom: isMobile ? 'max(8px, env(safe-area-inset-bottom))' : '12px' }}>
            <Space.Compact style={{ width: '100%' }}>
              <Popover content={quickReplyContent} title="快捷回复" trigger="click" placement="topLeft">
                <Button icon={<ThunderboltOutlined />} />
              </Popover>
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isMobile ? "输入消息" : "输入消息，按Enter发送"}
                disabled={sending}
                autoComplete="off"
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={sending}
              >
                {isMobile ? '' : '发送'}
              </Button>
            </Space.Compact>
          </div>
        </>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Empty description="请选择一个会话" />
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <div className="fade-in">
        <h2 style={{ marginBottom: 16 }}>在线聊天</h2>
        <Card bodyStyle={{ padding: 0, height: 'calc(100vh - 200px)', minHeight: 400 }}>
          {showChatArea ? renderChatArea() : renderSessionList()}
        </Card>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: 24 }}>在线聊天</h2>

      <div className="chat-container">
        <div className="chat-sessions">
          {renderSessionList()}
        </div>

        <div className="chat-main">
          {renderChatArea()}
        </div>
      </div>
    </div>
  )
}

export default Chat
