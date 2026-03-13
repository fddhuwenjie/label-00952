/**
 * 登录页面 - 现代化设计
 */
import { useState, useEffect } from 'react'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { authApi } from '../services/api'
import useStore from '../store/useStore'

function Login() {
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const login = useStore((state) => state.login)

  useEffect(() => {
    setMounted(true)
  }, [])

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await authApi.login(values)
      login(res.data.user, res.data.token)
      message.success('登录成功')
      setTimeout(() => {
        window.location.href = '/'
      }, 100)
    } catch (error) {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* 动态背景 */}
      <div className="login-bg">
        <div className="login-bg-shape login-bg-shape-1" />
        <div className="login-bg-shape login-bg-shape-2" />
        <div className="login-bg-shape login-bg-shape-3" />
        <div className="login-bg-grid" />
      </div>

      {/* 左侧品牌区域 */}
      <div className={`login-brand ${mounted ? 'login-brand-visible' : ''}`}>
        <div className="login-brand-content">
          <div className="login-brand-logo">
            <span className="login-brand-icon">🐟</span>
          </div>
          <h1 className="login-brand-title">闲鱼管理系统</h1>
          <p className="login-brand-subtitle">智能化运营 · 高效管理 · 数据驱动</p>
          
          <div className="login-brand-features">
            <div className="login-feature-item">
              <div className="login-feature-icon">📊</div>
              <div className="login-feature-text">
                <span className="login-feature-title">数据分析</span>
                <span className="login-feature-desc">实时监控运营数据</span>
              </div>
            </div>
            <div className="login-feature-item">
              <div className="login-feature-icon">🤖</div>
              <div className="login-feature-text">
                <span className="login-feature-title">智能回复</span>
                <span className="login-feature-desc">AI驱动自动化客服</span>
              </div>
            </div>
            <div className="login-feature-item">
              <div className="login-feature-icon">📦</div>
              <div className="login-feature-text">
                <span className="login-feature-title">订单管理</span>
                <span className="login-feature-desc">一站式订单处理</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className={`login-form-container ${mounted ? 'login-form-visible' : ''}`}>
        <div className="login-form-wrapper">
          <div className="login-form-header">
            <h2 className="login-form-title">欢迎回来</h2>
            <p className="login-form-desc">请输入您的账号信息登录系统</p>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            className="login-form"
          >
            <div className="login-input-group">
              <label className="login-input-label">用户名</label>
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input
                  prefix={<UserOutlined className="login-input-icon" />}
                  placeholder="请输入用户名"
                  className="login-input"
                />
              </Form.Item>
            </div>

            <div className="login-input-group">
              <label className="login-input-label">密码</label>
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="login-input-icon" />}
                  placeholder="请输入密码"
                  className="login-input"
                />
              </Form.Item>
            </div>

            <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="login-submit-btn"
              >
                <span>登录系统</span>
                {!loading && <ArrowRightOutlined className="login-btn-arrow" />}
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="login-copyright">
          © 2026 闲鱼管理系统 · 保留所有权利
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          position: relative;
          overflow: hidden;
          background: #0a0a0f;
        }

        /* 动态背景 */
        .login-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .login-bg-shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
          animation: float 20s ease-in-out infinite;
        }

        .login-bg-shape-1 {
          width: 600px;
          height: 600px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          top: -200px;
          left: -100px;
          animation-delay: 0s;
        }

        .login-bg-shape-2 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          bottom: -150px;
          right: -100px;
          animation-delay: -5s;
        }

        .login-bg-shape-3 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -10s;
          opacity: 0.3;
        }

        .login-bg-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.05); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(20px, 30px) scale(1.02); }
        }

        /* 左侧品牌区域 */
        .login-brand {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px;
          position: relative;
          z-index: 1;
          opacity: 0;
          transform: translateX(-30px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .login-brand-visible {
          opacity: 1;
          transform: translateX(0);
        }

        .login-brand-content {
          max-width: 480px;
          color: #fff;
        }

        .login-brand-logo {
          margin-bottom: 24px;
        }

        .login-brand-icon {
          font-size: 64px;
          display: inline-block;
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .login-brand-title {
          font-size: 42px;
          font-weight: 700;
          margin: 0 0 16px;
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-brand-subtitle {
          font-size: 18px;
          color: rgba(255,255,255,0.7);
          margin: 0 0 48px;
          letter-spacing: 2px;
        }

        .login-brand-features {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .login-feature-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          background: rgba(255,255,255,0.05);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .login-feature-item:hover {
          background: rgba(255,255,255,0.1);
          transform: translateX(8px);
        }

        .login-feature-icon {
          font-size: 32px;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
        }

        .login-feature-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .login-feature-title {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }

        .login-feature-desc {
          font-size: 14px;
          color: rgba(255,255,255,0.6);
        }

        /* 右侧登录表单 */
        .login-form-container {
          width: 520px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px;
          background: rgba(255,255,255,0.98);
          position: relative;
          z-index: 2;
          opacity: 0;
          transform: translateX(30px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: 0.2s;
        }

        .login-form-visible {
          opacity: 1;
          transform: translateX(0);
        }

        .login-form-wrapper {
          width: 100%;
          max-width: 360px;
          margin: 0 auto;
        }

        .login-form-header {
          margin-bottom: 40px;
        }

        .login-form-title {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 12px;
        }

        .login-form-desc {
          font-size: 15px;
          color: #6b7280;
          margin: 0;
        }

        .login-input-group {
          margin-bottom: 24px;
        }

        .login-input-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .login-input {
          height: 52px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          font-size: 15px;
          transition: all 0.3s ease;
        }

        .login-input:hover {
          border-color: #d1d5db;
        }

        .login-input:focus,
        .login-input-affix-wrapper:focus,
        .login-input-affix-wrapper-focused {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
        }

        .login-input-icon {
          color: #9ca3af;
          font-size: 18px;
        }

        .login-form .ant-input-affix-wrapper {
          height: 52px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          padding: 0 16px;
          transition: all 0.3s ease;
        }

        .login-form .ant-input-affix-wrapper:hover {
          border-color: #d1d5db;
        }

        .login-form .ant-input-affix-wrapper-focused {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
        }

        .login-form .ant-input {
          font-size: 15px;
        }

        .login-submit-btn {
          height: 52px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        }

        .login-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        }

        .login-submit-btn:active {
          transform: translateY(0);
        }

        .login-btn-arrow {
          transition: transform 0.3s ease;
        }

        .login-submit-btn:hover .login-btn-arrow {
          transform: translateX(4px);
        }

        .login-footer {
          margin-top: 48px;
        }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #9ca3af;
          font-size: 13px;
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }

        .login-demo-account {
          text-align: center;
          margin: 16px 0 0;
          padding: 12px 20px;
          background: #f3f4f6;
          border-radius: 8px;
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 14px;
          color: #6b7280;
          letter-spacing: 1px;
        }

        .login-copyright {
          position: absolute;
          bottom: 24px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
        }

        /* 响应式 */
        @media (max-width: 1024px) {
          .login-brand {
            display: none;
          }

          .login-form-container {
            width: 100%;
            background: transparent;
          }

          .login-form-wrapper {
            background: rgba(255,255,255,0.98);
            padding: 48px 40px;
            border-radius: 24px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.25);
          }

          .login-form-title {
            text-align: center;
          }

          .login-form-desc {
            text-align: center;
          }

          .login-copyright {
            color: rgba(255,255,255,0.6);
          }
        }

        @media (max-width: 480px) {
          .login-form-container {
            padding: 24px;
          }

          .login-form-wrapper {
            padding: 32px 24px;
          }

          .login-form-title {
            font-size: 26px;
          }

          .login-brand-icon {
            font-size: 48px;
          }
        }
      `}</style>
    </div>
  )
}

export default Login
