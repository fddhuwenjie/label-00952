/**
 * 系统设置页面
 */
import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Switch, Tabs, message, Descriptions, Space, Modal } from 'antd'
import { KeyOutlined, ReloadOutlined } from '@ant-design/icons'
import { authApi, configApi } from '../services/api'
import useStore from '../store/useStore'

function Settings() {
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [configs, setConfigs] = useState({})
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const user = useStore((state) => state.user)
  const setUser = useStore((state) => state.setUser)
  const [passwordForm] = Form.useForm()
  const [profileForm] = Form.useForm()

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchUserInfo()
    fetchConfigs()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const res = await authApi.getMe()
      setUserInfo(res.data)
      profileForm.setFieldsValue(res.data)
    } catch (error) {}
  }

  const fetchConfigs = async () => {
    try {
      const res = await configApi.getAll()
      setConfigs(res.data || {})
    } catch (error) {}
  }

  const handleUpdateProfile = async (values) => {
    setLoading(true)
    try {
      await authApi.updateProfile(values)
      message.success('个人信息更新成功')
      fetchUserInfo()
    } catch (error) {}
    setLoading(false)
  }

  const handleChangePassword = async (values) => {
    setLoading(true)
    try {
      await authApi.changePassword(values)
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error) {}
    setLoading(false)
  }

  const handleRefreshApiKey = () => {
    Modal.confirm({
      title: '刷新API密钥',
      content: '确定要刷新API密钥吗？刷新后旧的密钥将失效。',
      onOk: async () => {
        try {
          const res = await authApi.refreshApiKey()
          message.success('API密钥已刷新')
          fetchUserInfo()
        } catch (error) {}
      },
    })
  }

  const handleUpdateConfig = async (key, value) => {
    try {
      await configApi.update(key, value)
      message.success('配置已更新')
      fetchConfigs()
    } catch (error) {}
  }

  const tabItems = [
    {
      key: 'profile',
      label: '个人信息',
      children: (
        <Card bodyStyle={{ padding: isMobile ? 16 : 24 }}>
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleUpdateProfile}
            style={{ maxWidth: isMobile ? '100%' : 400 }}
          >
            <Form.Item label="用户名">
              <Input value={userInfo?.username} disabled />
            </Form.Item>
            <Form.Item name="email" label="邮箱">
              <Input placeholder="请输入邮箱" />
            </Form.Item>
            <Form.Item name="phone" label="手机号">
              <Input placeholder="请输入手机号" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block={isMobile}>
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'password',
      label: '修改密码',
      children: (
        <Card bodyStyle={{ padding: isMobile ? 16 : 24 }}>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
            style={{ maxWidth: isMobile ? '100%' : 400 }}
          >
            <Form.Item
              name="old_password"
              label="原密码"
              rules={[{ required: true, message: '请输入原密码' }]}
            >
              <Input.Password placeholder="请输入原密码" />
            </Form.Item>
            <Form.Item
              name="new_password"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码长度不能小于6位' },
              ]}
            >
              <Input.Password placeholder="请输入新密码" />
            </Form.Item>
            <Form.Item
              name="confirm_password"
              label="确认新密码"
              dependencies={['new_password']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('new_password') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请再次输入新密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block={isMobile}>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'api',
      label: 'API接口',
      children: (
        <Card bodyStyle={{ padding: isMobile ? 16 : 24 }}>
          <Descriptions column={1} bordered size={isMobile ? 'small' : 'default'}>
            <Descriptions.Item label="API Key">
              <div style={{ wordBreak: 'break-all' }}>
                <code style={{ backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: 4, fontSize: isMobile ? 12 : 14 }}>
                  {userInfo?.api_key || '-'}
                </code>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="操作">
              <Button icon={<ReloadOutlined />} onClick={handleRefreshApiKey} size={isMobile ? 'small' : 'middle'}>
                刷新密钥
              </Button>
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: 24 }}>
            <h4>接口调用示例</h4>
            <Card size="small" style={{ backgroundColor: '#f5f5f5' }}>
              <pre style={{ margin: 0, fontSize: isMobile ? 11 : 12, overflow: 'auto' }}>
{`// 请求头
X-Api-Key: ${userInfo?.api_key || 'your_api_key'}

// 可选签名(提高安全性)
X-Timestamp: 1234567890
X-Api-Sign: md5(api_key + api_secret + timestamp)

// 示例: 接收买家消息
POST /api/v1/chat/receive
{
  "account_id": 1,
  "buyer_id": "buyer123",
  "buyer_name": "买家昵称",
  "content": "消息内容"
}`}
              </pre>
            </Card>
          </div>
        </Card>
      ),
    },
    {
      key: 'system',
      label: '系统设置',
      children: (
        <Card bodyStyle={{ padding: isMobile ? 16 : 24 }}>
          <Form layout="vertical" style={{ maxWidth: isMobile ? '100%' : 500 }}>
            <Form.Item label="站点名称">
              <Input
                value={configs.site_name?.value || ''}
                onChange={(e) => handleUpdateConfig('site_name', e.target.value)}
                onBlur={(e) => handleUpdateConfig('site_name', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="自动回复总开关">
              <Switch
                checked={configs.auto_reply_enabled?.value === '1'}
                onChange={(checked) => handleUpdateConfig('auto_reply_enabled', checked ? '1' : '0')}
              />
            </Form.Item>
            <Form.Item label="自动发货总开关">
              <Switch
                checked={configs.auto_delivery_enabled?.value === '1'}
                onChange={(checked) => handleUpdateConfig('auto_delivery_enabled', checked ? '1' : '0')}
              />
            </Form.Item>
            <Form.Item label="消息提示音">
              <Switch
                checked={configs.notification_sound?.value === '1'}
                onChange={(checked) => handleUpdateConfig('notification_sound', checked ? '1' : '0')}
              />
            </Form.Item>
            <Form.Item label="库存预警阈值">
              <Input
                type="number"
                value={configs.stock_warning_threshold?.value || '10'}
                style={{ width: isMobile ? '100%' : 120 }}
                onChange={(e) => handleUpdateConfig('stock_warning_threshold', e.target.value)}
              />
            </Form.Item>
          </Form>
        </Card>
      ),
    },
  ]

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: isMobile ? 16 : 24 }}>系统设置</h2>
      <Tabs items={tabItems} tabPosition={isMobile ? 'top' : 'top'} />
    </div>
  )
}

export default Settings
