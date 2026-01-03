// src/views/pages/users/Users.js
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CBadge,
  CSpinner,
  CPagination,
  CPaginationItem,
  CAlert,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilMagnifyingGlass,
  cilSortAscending,
  cilSortDescending,
  cilPlus,
  cilCopy,
  cilSpreadsheet,
  cilPrint,
  cilReload,
} from '@coreui/icons'

import usersService from '../../../services/usersService'
import warehouseService from '../../../services/warehouseService'

// -------- Add User Modal (with subtle scale/fade animation) --------
const AddUserModal = ({ visible, onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',        // default
    warehouseId: '',     // empty string means none
  })
  const [submitting, setSubmitting] = useState(false)
  const [warehouses, setWarehouses] = useState([])
  const [loadingWH, setLoadingWH] = useState(false)
  const [error, setError] = useState('')

  // Load warehouses when opened
  useEffect(() => {
    const run = async () => {
      if (!visible) return
      setLoadingWH(true)
      setError('')
      try {
        const list = await warehouseService.getAll() // expects array with { _id, name, ... }
        setWarehouses(Array.isArray(list) ? list : [])
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load warehouses')
      } finally {
        setLoadingWH(false)
      }
    }
    run()
  }, [visible])

  const update = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,              // driver | user | csr_user (hardcoded options below)
        warehouseId: form.warehouseId || '',
      }
      await usersService.add(payload)
      onCreated?.()
      onClose()
      setForm({ name: '', email: '', phone: '', password: '', role: 'user', warehouseId: '' })
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to add user')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      size="lg"
      className={`add-user-anim ${visible ? 'show-anim' : ''}`}
      alignment="center"
      scrollable
    >
      <CModalHeader closeButton>
        <CModalTitle>Add User</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {error && <CAlert color="danger" className="mb-3">{error}</CAlert>}

        <CRow className="g-3">
          <CCol md={6}>
            <CFormInput
              label="Name *"
              name="name"
              value={form.name}
              onChange={update}
              required
            />
          </CCol>
          <CCol md={6}>
            <CFormInput
              label="Email *"
              type="email"
              name="email"
              value={form.email}
              onChange={update}
              required
            />
          </CCol>

          <CCol md={6}>
            <CFormInput
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={update}
              placeholder="+92-300-0000000"
            />
          </CCol>
          <CCol md={6}>
            <CFormInput
              label="Password *"
              type="password"
              name="password"
              value={form.password}
              onChange={update}
              required
            />
          </CCol>

          <CCol md={6}>
            <CFormSelect
              label="Role *"
              name="role"
              value={form.role}
              onChange={update}
            >
              {/* Hardcoded role options as requested */}
              <option value="driver">driver</option>
              <option value="user">user</option>
              <option value="csr_user">csr_user</option>
              <option value="admin">admin</option>
            </CFormSelect>
          </CCol>

          <CCol md={6}>
            <CFormSelect
              label="Warehouse (optional)"
              name="warehouseId"
              value={form.warehouseId}
              onChange={update}
              disabled={loadingWH}
            >
              <option value="">— None —</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>{w.name}</option>
              ))}
            </CFormSelect>
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>
          Cancel
        </CButton>
        <CButton color="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <CSpinner size="sm" /> : 'Create User'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // DataTable controls
  const [globalSearch, setGlobalSearch] = useState('')
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    warehouse: '',
    active: '', // '', 'true', 'false'
  })
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(15)

  // Add user modal
  const [addOpen, setAddOpen] = useState(false)

  const tableRef = useRef(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const list = await usersService.getAll()
      setUsers(Array.isArray(list) ? list : [])
      setError('')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // Sorting
  const handleSort = useCallback(
    (field) => {
      if (sortField === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortDirection('asc')
      }
    },
    [sortField],
  )

  // Reset filters
  const resetFilters = () => {
    setGlobalSearch('')
    setFilters({ name: '', email: '', phone: '', role: '', warehouse: '', active: '' })
    setPage(0)
  }

  // Build a normalized string for search
  const normalize = (v) => (v == null ? '' : String(v)).toLowerCase()

  // Filter + sort
  const filtered = useMemo(() => {
    const text = normalize(globalSearch)

    const list = users.filter((u) => {
      const name = normalize(u.name)
      const email = normalize(u.email)
      const phone = normalize(u.phone)
      const roleName = normalize(u.roleId?.name)
      const whName = normalize(u.warehouseId?.name) // expanded warehouse
      const active = String(!!u.isActive)

      // Global search across key fields
      const matchesGlobal =
        !text ||
        [name, email, phone, roleName, whName].some((field) => field.includes(text))

      // Column filters
      const f = filters
      const matchesCol =
        (!f.name || name.includes(normalize(f.name))) &&
        (!f.email || email.includes(normalize(f.email))) &&
        (!f.phone || phone.includes(normalize(f.phone))) &&
        (!f.role || roleName === normalize(f.role)) &&
        (!f.warehouse || whName.includes(normalize(f.warehouse))) &&
        (!f.active || String(f.active) === active)

      return matchesGlobal && matchesCol
    })

    return list.sort((a, b) => {
      const pick = (obj) => {
        switch (sortField) {
          case 'role':
            return normalize(obj.roleId?.name)
          case 'warehouse':
            return normalize(obj.warehouseId?.name)
          case 'createdAt':
            return obj.createdAt || ''
          default:
            return normalize(obj[sortField])
        }
      }
      const av = pick(a)
      const bv = pick(b)
      if (av < bv) return sortDirection === 'asc' ? -1 : 1
      if (av > bv) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [users, globalSearch, filters, sortField, sortDirection])

  // Pagination
  const paginated = useMemo(() => {
    const start = page * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])
  const totalPages = Math.ceil(filtered.length / pageSize)

  // Export helpers
  const toCSV = (rows) => {
    const header = ['Name', 'Email', 'Phone', 'Role', 'Warehouse', 'Active', 'Created']
    const lines = rows.map((u) => [
      u.name || '',
      u.email || '',
      u.phone || '',
      u.roleId?.name || '',
      u.warehouseId?.name || '',
      u.isActive ? 'Yes' : 'No',
      u.createdAt ? new Date(u.createdAt).toLocaleString() : '',
    ])
    const csv = [header, ...lines]
      .map((r) =>
        r
          .map((cell) => {
            const s = String(cell ?? '')
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
          })
          .join(','),
      )
      .join('\n')
    return csv
  }

  const handleExportCSV = () => {
    const csv = toCSV(filtered)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    try {
      const csv = toCSV(filtered)
      await navigator.clipboard.writeText(csv)
      // quick visual feedback
      alert('Copied current view (CSV) to clipboard.')
    } catch {
      alert('Copy failed.')
    }
  }

  const handlePrint = () => {
    const header = `
      <style>
        body { font-family: Arial, sans-serif; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background: #f3f3f3; }
      </style>
      <h2>Users</h2>
    `
    const rows = filtered
      .map(
        (u) => `
      <tr>
        <td>${u.name || ''}</td>
        <td>${u.email || ''}</td>
        <td>${u.phone || ''}</td>
        <td>${u.roleId?.name || ''}</td>
        <td>${u.warehouseId?.name || ''}</td>
        <td>${u.isActive ? 'Yes' : 'No'}</td>
        <td>${u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}</td>
      </tr>`,
      )
      .join('')
    const html = `
      ${header}
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Warehouse</th><th>Active</th><th>Created</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `
    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
    w.close()
  }

  const getActiveBadge = (isActive) => (isActive ? 'success' : 'secondary')

  return (
    <CContainer fluid className="mt-4 px-0">
      {/* Top toolbar */}
      <CRow className="mb-3 align-items-center">
        <CCol md={4}>
          <CInputGroup size="sm">
            <CInputGroupText>
              <CIcon icon={cilMagnifyingGlass} />
            </CInputGroupText>
            <CFormInput
              placeholder="Search name, email, phone, role, warehouse…"
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value)
                setPage(0)
              }}
            />
          </CInputGroup>
        </CCol>

        <CCol md={8} className="d-flex justify-content-end gap-2">
          <CButton color="secondary" variant="outline" size="sm" onClick={resetFilters}>
            <CIcon icon={cilReload} className="me-1" />
            Reset
          </CButton>
          <CButton color="secondary" variant="outline" size="sm" onClick={handleCopy}>
            <CIcon icon={cilCopy} className="me-1" />
            Copy
          </CButton>
          <CButton color="secondary" variant="outline" size="sm" onClick={handlePrint}>
            <CIcon icon={cilPrint} className="me-1" />
            Print
          </CButton>
          <CButton color="success" size="sm" onClick={handleExportCSV}>
            <CIcon icon={cilSpreadsheet} className="me-1" />
            Export CSV
          </CButton>
          <CButton color="info" size="sm" onClick={() => setAddOpen(true)}>
            <CIcon icon={cilPlus} className="me-1" />
            Add User
          </CButton>
        </CCol>
      </CRow>

      {error && <CAlert color="danger">{error}</CAlert>}

      <CCard className="mb-4" ref={tableRef}>
        <CCardBody className="px-0">
          {loading ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />
            </div>
          ) : (
            <>
              <div className="table-responsive px-3">
                <CTable hover responsive className="heavy-table">
                  <CTableHead>
                    {/* Sortable header */}
                    <CTableRow className="bg-light">
                      {[
                        { key: 'name', label: 'NAME', sortable: true },
                        { key: 'email', label: 'EMAIL', sortable: true },
                        { key: 'phone', label: 'PHONE', sortable: true },
                        { key: 'role', label: 'ROLE', sortable: true },
                        { key: 'warehouse', label: 'WAREHOUSE', sortable: true },
                        { key: 'isActive', label: 'ACTIVE', sortable: true },
                        { key: 'createdAt', label: 'CREATED', sortable: true },
                      ].map((col) => (
                        <CTableHeaderCell
                          key={col.key}
                          className={col.sortable ? 'cursor-pointer' : ''}
                          onClick={() => col.sortable && handleSort(col.key)}
                        >
                          {col.label}
                          {sortField === col.key && (
                            <CIcon
                              icon={sortDirection === 'asc' ? cilSortAscending : cilSortDescending}
                              className="ms-1"
                            />
                          )}
                        </CTableHeaderCell>
                      ))}
                    </CTableRow>

                    {/* Column filters row */}
                    <CTableRow className="bg-body">
                      <CTableHeaderCell>
                        <CFormInput
                          size="sm"
                          placeholder="Filter name"
                          value={filters.name}
                          onChange={(e) => {
                            setFilters((f) => ({ ...f, name: e.target.value }))
                            setPage(0)
                          }}
                        />
                      </CTableHeaderCell>
                      <CTableHeaderCell>
                        <CFormInput
                          size="sm"
                          placeholder="Filter email"
                          value={filters.email}
                          onChange={(e) => {
                            setFilters((f) => ({ ...f, email: e.target.value }))
                            setPage(0)
                          }}
                        />
                      </CTableHeaderCell>
                      <CTableHeaderCell>
                        <CFormInput
                          size="sm"
                          placeholder="Filter phone"
                          value={filters.phone}
                          onChange={(e) => {
                            setFilters((f) => ({ ...f, phone: e.target.value }))
                            setPage(0)
                          }}
                        />
                      </CTableHeaderCell>
                      <CTableHeaderCell>
                        <CFormSelect
                          size="sm"
                          value={filters.role}
                          onChange={(e) => {
                            setFilters((f) => ({ ...f, role: e.target.value }))
                            setPage(0)
                          }}
                        >
                          <option value="">All</option>
                          {/* roleId.name comes from API */}
                          <option value="admin">admin</option>
                          <option value="user">user</option>
                          <option value="driver">driver</option>
                          <option value="csr_user">csr_user</option>
                        </CFormSelect>
                      </CTableHeaderCell>
                      <CTableHeaderCell>
                        <CFormInput
                          size="sm"
                          placeholder="Filter warehouse"
                          value={filters.warehouse}
                          onChange={(e) => {
                            setFilters((f) => ({ ...f, warehouse: e.target.value }))
                            setPage(0)
                          }}
                        />
                      </CTableHeaderCell>
                      <CTableHeaderCell>
                        <CFormSelect
                          size="sm"
                          value={filters.active}
                          onChange={(e) => {
                            setFilters((f) => ({ ...f, active: e.target.value }))
                            setPage(0)
                          }}
                        >
                          <option value="">All</option>
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </CFormSelect>
                      </CTableHeaderCell>
                      <CTableHeaderCell />
                    </CTableRow>
                  </CTableHead>

                  <CTableBody>
                    {paginated.length ? (
                      paginated.map((u) => (
                        <CTableRow key={u._id}>
                          <CTableDataCell>{u.name || '—'}</CTableDataCell>
                          <CTableDataCell>{u.email || '—'}</CTableDataCell>
                          <CTableDataCell>{u.phone || '—'}</CTableDataCell>
                          <CTableDataCell>
                            <CBadge color="info">{u.roleId?.name || '—'}</CBadge>
                          </CTableDataCell>
                          <CTableDataCell>{u.warehouseId?.name || '—'}</CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={getActiveBadge(u.isActive)}>
                              {u.isActive ? 'Yes' : 'No'}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell>
                            {u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    ) : (
                      <CTableRow>
                        <CTableDataCell colSpan="7" className="text-center py-5">
                          No users found
                        </CTableDataCell>
                      </CTableRow>
                    )}
                  </CTableBody>
                </CTable>
              </div>

              {/* Footer controls: page size + pagination */}
              <CRow className="mt-3 px-3 align-items-center">
                <CCol sm="auto" className="mb-2 mb-sm-0">
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted">Rows per page:</span>
                    <CFormSelect
                      size="sm"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(parseInt(e.target.value) || 15)
                        setPage(0)
                      }}
                      style={{ width: 90 }}
                    >
                      {[10, 15, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </CFormSelect>
                  </div>
                </CCol>
                <CCol className="d-flex justify-content-center">
                  {totalPages > 1 && (
                    <CPagination size="sm">
                      <CPaginationItem disabled={page === 0} onClick={() => setPage(0)}>
                        &laquo;
                      </CPaginationItem>
                      <CPaginationItem disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                        &lsaquo;
                      </CPaginationItem>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <CPaginationItem key={i} active={i === page} onClick={() => setPage(i)}>
                          {i + 1}
                        </CPaginationItem>
                      ))}
                      <CPaginationItem
                        disabled={page === totalPages - 1}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        &rsaquo;
                      </CPaginationItem>
                      <CPaginationItem
                        disabled={page === totalPages - 1}
                        onClick={() => setPage(totalPages - 1)}
                      >
                        &raquo;
                      </CPaginationItem>
                    </CPagination>
                  )}
                </CCol>
                <CCol sm="auto" className="text-end text-muted">
                  Showing {paginated.length} of {filtered.length} filtered / {users.length} total
                </CCol>
              </CRow>
            </>
          )}
        </CCardBody>
      </CCard>

      {/* Add user modal */}
      <AddUserModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={fetchUsers}
      />

      {/* styles */}
      <style>
        {`
          .heavy-table th, .heavy-table td { padding: 1.1rem .9rem; }
          .cursor-pointer { cursor: pointer; }
          /* Subtle enter animation for modal content */
          .add-user-anim .modal-content {
            transform: scale(.98);
            opacity: 0;
            transition: transform .18s ease, opacity .18s ease;
          }
          .add-user-anim.show-anim .modal-content {
            transform: scale(1);
            opacity: 1;
          }
        `}
      </style>
    </CContainer>
  )
}

export default Users
