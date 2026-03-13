/**
 * 账号管理页面
 */
import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Space, Input, Select, Tag, Modal, Form, message, Popconfirm,
  Tabs, List, Typography, Empty, Tooltip, Dropdown,
} from 'antd'
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  FolderOutlined, SettingOutlined, FilterOutlined, MoreOutlined,
} from '@ant-design/icons'

import { accountApi } from '../services/api'
import dayjs from 'dayjs'

const { Text } = Typography

const statusOptions = [
  { value: 'online', label: '在线', color: 'success' },
  { value: 'offline', label: '离线', color: 'default' },
  { value: 'error', label: '异常', color: 'error' },
]

function Accounts() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [filters, setFilters] = useState({})
  const [groups, setGroups] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [form] = Form.useForm()
  
  // 分组管理
  const [groupModalVisible, setGroupModalVisible] = useState(false)
  const [groupForm] = Form.useForm()
  const [editingGroup, setEditingGroup] = useState(null)
  const [filterVisible, setFilterVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchGroups()
    fetchData()
  }, [])

  useEffect(() => {
    if (modalVisible) {
      if (editingRecord) {
        form.setFieldsValue(editingRecord)
      } else {
        form.resetFields()
      }
    }
  }, [modalVisible, editingRecord])

  useEffect(() => {
    if (groupModalVisible) {
      if (editingGroup) {
        groupForm.setFieldsValue(editingGroup)
      } else {
        groupForm.resetFields()
      }
    }
  }, [groupModalVisible, editingGroup])

  const fetchGroups = async () => {
    try {
      const res = await accountApi.getGroups()
      setGroups(res.data || [])
    } catch (error) {}
  }

  const fetchData = async (page = 1, pageSize = 20, newFilters = filters) => {
    setLoading(true)
    try {
      const res = await accountApi.getList({
        page,
        per_page: pageSize,
        ...newFilters,
      })
      setData(res.data || [])
      setPagination({
        current: res.pagination?.page || 1,
        pageSize: res.pagination?.per_page || 20,
        total: res.pagination?.total || 0,
      })
    } catch (error) {}
    setLoading(false)
  }

  const handleTableChange = (pag) => {
    fetchData(pag.current, pag.pageSize)
  }

  const handleSearch = () => {
    fetchData(1, pagination.pageSize, filters)
    setFilterVisible(false)
  }

  const handleAdd = () => {
    setEditingRecord(null)
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await accountApi.delete(id)
      message.success('删除成功')
      fetchData(pagination.current, pagination.pageSize)
    } catch (error) {}
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        await accountApi.update(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await accountApi.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData(pagination.current, pagination.pageSize)
    } catch (error) {}
  }

  // ===== 分组管理 =====
  const handleAddGroup = () => {
    setEditingGroup(null)
    setGroupModalVisible(true)
  }

  const handleEditGroup = (group) => {
    setEditingGroup(group)
    setGroupModalVisible(true)
  }

  const handleDeleteGroup = async (id) => {
    try {
      await accountApi.deleteGroup(id)
      message.success('分组删除成功')
      fetchGroups()
      fetchData(pagination.current, pagination.pageSize)
    } catch (error) {}
  }

  const handleGroupSubmit = async () => {
    try {
      const values = await groupForm.validateFields()
      if (editingGroup) {
        await accountApi.updateGroup(editingGroup.id, values)
        message.success('分组更新成功')
      } else {
        await accountApi.createGroup(values)
        message.success('分组创建成功')
      }
      setGroupModalVisible(false)
      fetchGroups()
    } catch (error) {}
  }

  // 移动端操作菜单
  const getActionMenuItems = (record) => [
    { key: 'edit', label: '编辑', icon: <EditOutlined />, onClick: () => handleEdit(record) },
    { 
      key: 'delete', 
      label: '删除', 
      icon: <DeleteOutlined />, 
      danger: true,
      onClick: () => Modal.confirm({ title: '确定删除?', onOk: () => handleDelete(record.id) })
    },
  ]

  // 桌面端列配置
  const desktopColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 50,
      fixed: 'left',
    },
    {
      title: '账号名称',
      dataIndex: 'name',
      width: 120,
      ellipsis: true,
    },
    {
      title: '闲鱼ID',
      dataIndex: 'xianyu_id',
      width: 120,
      ellipsis: true,
    },
    {
      title: '分组',
      dataIndex: 'group_name',
      width: 100,
      render: (val) => val ? <Tag icon={<FolderOutlined />}>{val}</Tag> : <Text type="secondary">未分组</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 70,
      render: (val) => {
        const item = statusOptions.find((o) => o.value === val)
        return <Tag color={item?.color}>{item?.label || val}</Tag>
      },
    },
    {
      title: '最后活跃',
      dataIndex: 'last_active_at',
      width: 100,
      render: (val) => val ? dayjs(val).format('MM-DD HH:mm') : '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 150,
      ellipsis: true,
      render: (val) => val || '-',
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Tooltip title="删除">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 移动端列配置
  const mobileColumns = [
    {
      title: '账号信息',
      render: (_, record) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{record.name}</span>
            <Tag color={statusOptions.find(o => o.value === record.status)?.color}>
              {statusOptions.find(o => o.value === record.status)?.label}
            </Tag>
          </div>
          <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
            闲鱼ID: {record.xianyu_id || '-'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {record.group_name ? (
              <Tag icon={<FolderOutlined />} style={{ margin: 0 }}>{record.group_name}</Tag>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>未分组</Text>
            )}
            <span style={{ color: '#999', fontSize: 12 }}>
              {record.last_active_at ? dayjs(record.last_active_at).format('MM-DD HH:mm') : '-'}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: '操作', width: 50,
      render: (_, record) => (
        <Dropdown menu={{ items: getActionMenuItems(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  // 分组管理Tab内容
  const GroupManagement = () => (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? 12 : 0 }}>
        <Text type="secondary" style={{ fontSize: isMobile ? 13 : 14 }}>
          分组用于对闲鱼账号进行分类管理，例如按店铺、按商品类型、按运营人员等维度进行分组。
        </Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddGroup} block={isMobile}>
          添加分组
        </Button>
      </div>
      {groups.length === 0 ? (
        <Empty description="暂无分组，点击上方按钮添加" />
      ) : (
        <List
          bordered
          dataSource={groups}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button type="link" size="small" onClick={() => handleEditGroup(item)}>编辑</Button>,
                <Popconfirm title="删除分组后，该分组下的账号将变为未分组状态，确定删除？" onConfirm={() => handleDeleteGroup(item.id)}>
                  <Button type="link" size="small" danger>删除</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                avatar={<FolderOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
                title={item.name}
                description={item.description || '暂无描述'}
              />
              <div>排序: {item.sort || 0}</div>
            </List.Item>
          )}
        />
      )}
    </div>
  )

  const tabItems = [
    {
      key: 'accounts',
      label: '账号列表',
      children: (
        <>
          {/* 搜索栏 */}
          {isMobile ? (
            <div style={{ marginBottom: 16 }}>
              <Space style={{ width: '100%', marginBottom: 12 }}>
                <Input
                  placeholder="搜索账号名称/闲鱼ID"
                  prefix={<SearchOutlined />}
                  style={{ flex: 1 }}
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  onPressEnter={handleSearch}
                />
                <Button icon={<FilterOutlined />} onClick={() => setFilterVisible(true)} />
                <Button type="primary" onClick={handleSearch}>搜索</Button>
              </Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} block>
                添加账号
              </Button>
            </div>
          ) : (
            <div className="table-toolbar">
              <div className="table-toolbar-left">
                <Input
                  placeholder="搜索账号名称/闲鱼ID"
                  prefix={<SearchOutlined />}
                  style={{ width: 200 }}
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  onPressEnter={handleSearch}
                />
                <Select
                  placeholder="状态"
                  allowClear
                  style={{ width: 120 }}
                  options={statusOptions}
                  value={filters.status}
                  onChange={(val) => setFilters({ ...filters, status: val })}
                />
                <Select
                  placeholder="分组"
                  allowClear
                  style={{ width: 150 }}
                  options={groups.map((g) => ({ value: g.id, label: g.name }))}
                  value={filters.group_id}
                  onChange={(val) => setFilters({ ...filters, group_id: val })}
                />
                <Button type="primary" onClick={handleSearch}>搜索</Button>
              </div>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加账号
              </Button>
            </div>
          )}

          <Table
            columns={isMobile ? mobileColumns : desktopColumns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              size: isMobile ? 'small' : 'default',
              showSizeChanger: !isMobile,
              showTotal: isMobile ? undefined : (total) => `共 ${total} 条`,
            }}
            onChange={handleTableChange}
            scroll={isMobile ? undefined : { x: 850 }}
            size={isMobile ? 'small' : 'middle'}
          />
        </>
      ),
    },
    {
      key: 'groups',
      label: (
        <span>
          <SettingOutlined /> 分组管理
        </span>
      ),
      children: <GroupManagement />,
    },
  ]

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: isMobile ? 16 : 24 }}>账号管理</h2>

      <Card bodyStyle={{ padding: isMobile ? 12 : 24 }}>
        <Tabs items={tabItems} />
      </Card>

      {/* 移动端筛选弹窗 */}
      <Modal
        title="筛选条件"
        open={filterVisible}
        onOk={handleSearch}
        onCancel={() => setFilterVisible(false)}
        okText="搜索"
      >
        <Form layout="vertical">
          <Form.Item label="状态">
            <Select
              placeholder="选择状态"
              allowClear
              options={statusOptions}
              value={filters.status}
              onChange={(val) => setFilters({ ...filters, status: val })}
            />
          </Form.Item>
          <Form.Item label="分组">
            <Select
              placeholder="选择分组"
              allowClear
              options={groups.map((g) => ({ value: g.id, label: g.name }))}
              value={filters.group_id}
              onChange={(val) => setFilters({ ...filters, group_id: val })}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加/编辑账号弹窗 */}
      <Modal
        title={editingRecord ? '编辑账号' : '添加账号'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose={false}
        width={isMobile ? '95%' : 520}
        transitionName=""
        maskTransitionName=""
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="账号名称" rules={[{ required: true, message: '请输入账号名称' }]}>
            <Input placeholder="请输入账号名称，如：店铺A主号" />
          </Form.Item>
          <Form.Item name="xianyu_id" label="闲鱼ID">
            <Input placeholder="请输入闲鱼平台的用户ID" />
          </Form.Item>
          <Form.Item 
            name="group_id" 
            label="分组"
            tooltip="选择账号所属分组，便于分类管理"
          >
            <Select
              placeholder="选择分组（可在分组管理中添加）"
              allowClear
              options={groups.map((g) => ({ value: g.id, label: g.name }))}
            />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="offline">
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="cookie" label="Cookie" tooltip="用于自动化操作时登录闲鱼账号">
            <Input.TextArea rows={3} placeholder="请输入Cookie（可选）" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加/编辑分组弹窗 */}
      <Modal
        title={editingGroup ? '编辑分组' : '添加分组'}
        open={groupModalVisible}
        onOk={handleGroupSubmit}
        onCancel={() => setGroupModalVisible(false)}
        destroyOnClose={false}
        width={isMobile ? '95%' : 520}
        transitionName=""
        maskTransitionName=""
      >
        <Form form={groupForm} layout="vertical">
          <Form.Item name="name" label="分组名称" rules={[{ required: true, message: '请输入分组名称' }]}>
            <Input placeholder="如：数码店铺、服装店铺、小张负责" />
          </Form.Item>
          <Form.Item name="description" label="分组描述">
            <Input.TextArea rows={2} placeholder="请输入分组描述" />
          </Form.Item>
          <Form.Item name="sort" label="排序" initialValue={0} tooltip="数值越小越靠前">
            <Input type="number" placeholder="排序数值，默认0" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Accounts
