/**
 * API 服务
 */
import request from '../utils/request'

// 认证相关
export const authApi = {
  login: (data) => request.post('/auth/login', data),
  getMe: () => request.get('/auth/me'),
  changePassword: (data) => request.put('/auth/password', data),
  updateProfile: (data) => request.put('/auth/profile', data),
  refreshApiKey: () => request.post('/auth/refresh-api-key'),
}

// 仪表盘
export const dashboardApi = {
  getStats: () => request.get('/dashboard/stats'),
  getRecentOrders: (limit = 10) => request.get('/dashboard/recent-orders', { params: { limit } }),
  getSalesTrend: (days = 7) => request.get('/dashboard/sales-trend', { params: { days } }),
  getHotProducts: (limit = 10) => request.get('/dashboard/hot-products', { params: { limit } }),
}

// 账号管理
export const accountApi = {
  getList: (params) => request.get('/accounts', { params }),
  getDetail: (id) => request.get(`/accounts/${id}`),
  create: (data) => request.post('/accounts', data),
  update: (id, data) => request.put(`/accounts/${id}`, data),
  delete: (id) => request.delete(`/accounts/${id}`),
  getStats: () => request.get('/accounts/stats'),
  getGroups: () => request.get('/account-groups'),
  createGroup: (data) => request.post('/account-groups', data),
  updateGroup: (id, data) => request.put(`/account-groups/${id}`, data),
  deleteGroup: (id) => request.delete(`/account-groups/${id}`),
}

// 商品管理
export const productApi = {
  getList: (params) => request.get('/products', { params }),
  getDetail: (id) => request.get(`/products/${id}`),
  create: (data) => request.post('/products', data),
  update: (id, data) => request.put(`/products/${id}`, data),
  delete: (id) => request.delete(`/products/${id}`),
  getStats: () => request.get('/products/stats'),
  getCategories: () => request.get('/product-categories'),
  createCategory: (data) => request.post('/product-categories', data),
  deleteCategory: (id) => request.delete(`/product-categories/${id}`),
}

// 订单管理
export const orderApi = {
  getList: (params) => request.get('/orders', { params }),
  getDetail: (id) => request.get(`/orders/${id}`),
  create: (data) => request.post('/orders', data),
  update: (id, data) => request.put(`/orders/${id}`, data),
  delete: (id) => request.delete(`/orders/${id}`),
  ship: (id, data) => request.post(`/orders/${id}/ship`, data),
  refund: (id) => request.post(`/orders/${id}/refund`),
  getStats: () => request.get('/orders/stats'),
}

// 卡券管理
export const couponApi = {
  getList: (params) => request.get('/coupons', { params }),
  getDetail: (id) => request.get(`/coupons/${id}`),
  create: (data) => request.post('/coupons', data),
  batchImport: (data) => request.post('/coupons/batch', data),
  update: (id, data) => request.put(`/coupons/${id}`, data),
  delete: (id) => request.delete(`/coupons/${id}`),
  getStats: (productId) => request.get('/coupons/stats', { params: { product_id: productId } }),
  getCategories: () => request.get('/coupon-categories'),
  createCategory: (data) => request.post('/coupon-categories', data),
  deleteCategory: (id) => request.delete(`/coupon-categories/${id}`),
}

// 自动回复
export const autoReplyApi = {
  getList: (params) => request.get('/auto-replies', { params }),
  getDetail: (id) => request.get(`/auto-replies/${id}`),
  create: (data) => request.post('/auto-replies', data),
  update: (id, data) => request.put(`/auto-replies/${id}`, data),
  delete: (id) => request.delete(`/auto-replies/${id}`),
}

// 指定回复
export const targetedReplyApi = {
  getList: (params) => request.get('/targeted-replies', { params }),
  getDetail: (id) => request.get(`/targeted-replies/${id}`),
  create: (data) => request.post('/targeted-replies', data),
  update: (id, data) => request.put(`/targeted-replies/${id}`, data),
  delete: (id) => request.delete(`/targeted-replies/${id}`),
}

// 聊天
export const chatApi = {
  getSessions: (params) => request.get('/chat/sessions', { params }),
  getMessages: (sessionId, params) => request.get(`/chat/sessions/${sessionId}/messages`, { params }),
  sendMessage: (sessionId, data) => request.post(`/chat/sessions/${sessionId}/messages`, data),
  getUnreadCount: () => request.get('/chat/unread'),
  getQuickReplies: () => request.get('/chat/quick-replies'),
  archiveSession: (sessionId) => request.post(`/chat/sessions/${sessionId}/archive`),
}

// 通知
export const notificationApi = {
  getList: (params) => request.get('/notifications', { params }),
  getUnreadCount: () => request.get('/notifications/unread-count'),
  markAsRead: (id) => request.post(`/notifications/${id}/read`),
  markAllAsRead: () => request.post('/notifications/read-all'),
  delete: (id) => request.delete(`/notifications/${id}`),
}

// 系统配置
export const configApi = {
  getAll: () => request.get('/configs'),
  get: (key) => request.get(`/configs/${key}`),
  update: (key, value) => request.put(`/configs/${key}`, { value }),
  batchUpdate: (data) => request.put('/configs', data),
}
