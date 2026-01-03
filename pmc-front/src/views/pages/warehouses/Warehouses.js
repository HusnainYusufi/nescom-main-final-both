// src/views/pages/warehouses/Warehouses.js
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CContainer,
  CRow,
  CCol,
  CButton,
  CAlert,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormInput,
  CBadge,
  CInputGroup,
  CInputGroupText,
  CFormSelect,
  CSpinner,
  CPagination,
  CPaginationItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPlus,
  cilSearch,
  cilCloudDownload,
  cilSync,
  cilTrash,
  cilSortAscending,
  cilSortDescending,
} from '@coreui/icons'
import warehouseService from '../../../services/warehouseService'

/** small utility */
const csvEscape = (v) => {
  const s = String(v ?? '')
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const pickErr = (e, fb = 'Something went wrong') => {
  const raw = e?.response?.data?.message || e?.response?.data?.error || e?.message || fb
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object') {
    if (typeof raw.message === 'string') return raw.message
    try {
      return JSON.stringify(raw)
    } catch {
      return fb
    }
  }
  return String(raw ?? fb)
}

/** Debounce hook (for search input) */
const useDebounced = (value, delay = 220) => {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

const Warehouses = () => {
  // data
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // add/edit modal
  const [modalVisible, setModalVisible] = useState(false)
  const [form, setForm] = useState({
    name: '',
    address: { line1: '', city: '', country: '' },
    contact: { person: '', phone: '', email: '' },
  })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // search/sort/pagination
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search, 240)
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // UI
  const [busyIds, setBusyIds] = useState(new Set()) // for delete buttons
  const tableTopRef = useRef(null)

  const fetchWarehouses = async () => {
    setLoading(true)
    setError('')
    try {
      const list = await warehouseService.getAll()
      setWarehouses(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(pickErr(err, 'Failed to load warehouses'))
      setWarehouses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const openModal = () => {
    setForm({
      name: '',
      address: { line1: '', city: '', country: '' },
      contact: { person: '', phone: '', email: '' },
    })
    setFormError('')
    setModalVisible(true)
  }
  const closeModal = () => setModalVisible(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    const path = name.split('.')
    setForm((prev) => {
      if (path.length === 1) return { ...prev, [name]: value }
      const [p1, p2] = path
      return { ...prev, [p1]: { ...(prev[p1] || {}), [p2]: value } }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await warehouseService.add(form)
      await fetchWarehouses()
      closeModal()
    } catch (err) {
      setFormError(pickErr(err, 'Failed to add warehouse'))
    } finally {
      setSaving(false)
    }
  }

  const tryDelete = async (id) => {
    if (!id) return
    if (!window.confirm('Delete this warehouse?')) return
    setBusyIds((s) => new Set(s).add(id))
    try {
      if (typeof warehouseService.remove === 'function') {
        await warehouseService.remove(id)
      } else {
        throw new Error('Delete API is not available')
      }
      setWarehouses((arr) => arr.filter((w) => w._id !== id))
    } catch (err) {
      alert(pickErr(err, 'Failed to delete warehouse'))
    } finally {
      setBusyIds((s) => {
        const n = new Set(s)
        n.delete(id)
        return n
      })
    }
  }

  /** derived: filtering */
  const filtered = useMemo(() => {
    const term = (debouncedSearch || '').trim().toLowerCase()
    if (!term) return warehouses
    return warehouses.filter((w) => {
      const values = [
        w.name,
        w?.address?.line1,
        w?.address?.city,
        w?.address?.country,
        w?.contact?.person,
        w?.contact?.phone,
        w?.contact?.email,
      ].map((x) => String(x || '').toLowerCase())
      return values.some((x) => x.includes(term))
    })
  }, [warehouses, debouncedSearch])

  /** derived: sorting */
  const sorted = useMemo(() => {
    const arr = [...filtered]
    const dir = sortDir === 'desc' ? -1 : 1
    const getter = (w) => {
      switch (sortBy) {
        case 'name':
          return String(w.name || '')
        case 'city':
          return String(w?.address?.city || '')
        case 'country':
          return String(w?.address?.country || '')
        case 'person':
          return String(w?.contact?.person || '')
        default:
          return String(w.name || '')
      }
    }
    arr.sort((a, b) => {
      const A = getter(a),
        B = getter(b)
      if (A < B) return -1 * dir
      if (A > B) return 1 * dir
      return 0
    })
    return arr
  }, [filtered, sortBy, sortDir])

  /** derived: pagination */
  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, page, pageSize])

  /** sorting controls */
  const toggleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(key)
      setSortDir('asc')
    }
    // scroll table back to top after sort
    tableTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /** export CSV */
  const exportCsv = () => {
    const headers = [
      'Name',
      'Address Line 1',
      'City',
      'Country',
      'Contact Person',
      'Phone',
      'Email',
    ]
    const rows = sorted.map((w) => [
      w.name,
      w?.address?.line1,
      w?.address?.city,
      w?.address?.country || '',
      w?.contact?.person,
      w?.contact?.phone,
      w?.contact?.email,
    ])
    const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `warehouses_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <CContainer className="mt-4 warehouses-page">
      {/* Header bar */}
      <div className="wp-toolbar" ref={tableTopRef}>
        <div className="left">
          <div className="title">Warehouses</div>
          <div className="sub">
            <CBadge color="dark" className="me-2">
              {warehouses.length} total
            </CBadge>
            <CBadge color="info">{total} shown</CBadge>
          </div>
        </div>
        <div className="right">
          <CInputGroup className="wp-search">
            <CInputGroupText>
              <CIcon icon={cilSearch} />
            </CInputGroupText>
            <CFormInput
              placeholder="Search by name, address, contact…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </CInputGroup>
          <CButton color="secondary" variant="outline" onClick={fetchWarehouses}>
            <CIcon icon={cilSync} className="me-1" /> Refresh
          </CButton>
          <CButton color="dark" onClick={exportCsv}>
            <CIcon icon={cilCloudDownload} className="me-1" /> Export CSV
          </CButton>
          <CButton color="primary" onClick={openModal}>
            <CIcon icon={cilPlus} className="me-1" /> Add Warehouse
          </CButton>
        </div>
      </div>

      {error && (
        <CAlert color="danger" className="mb-3">
          {error}
        </CAlert>
      )}

      {/* Table Card */}
      <div className="wp-card">
        {/* Table controls */}
        <div className="wp-controls">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Rows per page</span>
            <CFormSelect
              size="sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) || 10)
                setPage(1)
              }}
              style={{ width: 100 }}
            >
              {[10, 15, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </CFormSelect>
          </div>
          <div className="text-muted small">
            Showing <strong>{paginated.length}</strong> of <strong>{total}</strong> results
          </div>
        </div>

        {/* Table */}
        <div className="wp-table-wrap">
          <CTable hover responsive striped className="wp-table">
            <CTableHead className="sticky-head">
              <CTableRow>
                <CTableHeaderCell onClick={() => toggleSort('name')} role="button">
                  Name{' '}
                  {sortBy === 'name' ? (
                    <CIcon icon={sortDir === 'asc' ? cilSortAscending : cilSortDescending} />
                  ) : null}
                </CTableHeaderCell>
                <CTableHeaderCell>Address</CTableHeaderCell>
                <CTableHeaderCell
                  onClick={() => toggleSort('city')}
                  role="button"
                  className="th-tight"
                >
                  City{' '}
                  {sortBy === 'city' ? (
                    <CIcon icon={sortDir === 'asc' ? cilSortAscending : cilSortDescending} />
                  ) : null}
                </CTableHeaderCell>
                <CTableHeaderCell
                  onClick={() => toggleSort('country')}
                  role="button"
                  className="th-tight"
                >
                  Country{' '}
                  {sortBy === 'country' ? (
                    <CIcon icon={sortDir === 'asc' ? cilSortAscending : cilSortDescending} />
                  ) : null}
                </CTableHeaderCell>
                <CTableHeaderCell onClick={() => toggleSort('person')} role="button">
                  Contact Person{' '}
                  {sortBy === 'person' ? (
                    <CIcon icon={sortDir === 'asc' ? cilSortAscending : cilSortDescending} />
                  ) : null}
                </CTableHeaderCell>
                <CTableHeaderCell className="th-tight">Phone</CTableHeaderCell>
                <CTableHeaderCell className="th-tight">Email</CTableHeaderCell>
                <CTableHeaderCell className="th-actions">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {/* loading skeleton */}
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <CTableRow key={`sk-${i}`} className="skeleton-row">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <CTableDataCell key={`skc-${i}-${j}`}>
                        <div className="sk" />
                      </CTableDataCell>
                    ))}
                  </CTableRow>
                ))}

              {!loading && paginated.length === 0 && (
                <CTableRow>
                  <CTableDataCell colSpan={8} className="text-center text-muted py-4">
                    No warehouses match your search.
                  </CTableDataCell>
                </CTableRow>
              )}

              {!loading &&
                paginated.map((w) => {
                  const id = w._id || w.id
                  const deleting = busyIds.has(id)
                  return (
                    <CTableRow key={id} className="wp-row">
                      <CTableDataCell>
                        <div className="fw-semibold">{w.name || '—'}</div>
                      </CTableDataCell>
                      <CTableDataCell className="wp-address">
                        <div>{w?.address?.line1 || '—'}</div>
                        <div className="text-muted small">
                          {[w?.address?.city, w?.address?.country].filter(Boolean).join(', ') ||
                            '—'}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell className="nowrap">{w?.address?.city || '—'}</CTableDataCell>
                      <CTableDataCell className="nowrap">
                        {w?.address?.country || '—'}
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="fw-semibold">{w?.contact?.person || '—'}</div>
                      </CTableDataCell>
                      <CTableDataCell className="nowrap">{w?.contact?.phone || '—'}</CTableDataCell>
                      <CTableDataCell className="nowrap">
                        {w?.contact?.email ? (
                          <a href={`mailto:${w.contact.email}`}>{w.contact.email}</a>
                        ) : (
                          '—'
                        )}
                      </CTableDataCell>
                      <CTableDataCell className="th-actions">
                        <div className="d-flex gap-2">
                          <CButton
                            size="sm"
                            color="danger"
                            variant="outline"
                            onClick={() => tryDelete(id)}
                            disabled={deleting}
                            title="Delete"
                          >
                            {deleting ? <CSpinner size="sm" /> : <CIcon icon={cilTrash} />}
                          </CButton>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
            </CTableBody>
          </CTable>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="wp-pagination">
            <div className="text-muted small">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </div>
            <CPagination className="mb-0">
              <CPaginationItem
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </CPaginationItem>
              {Array.from({ length: totalPages })
                .slice(0, 7)
                .map((_, idx) => {
                  // simple compact pagination (first 7 pages)
                  const p = idx + 1
                  return (
                    <CPaginationItem key={p} active={p === page} onClick={() => setPage(p)}>
                      {p}
                    </CPaginationItem>
                  )
                })}
              <CPaginationItem
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </CPaginationItem>
            </CPagination>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <CModal visible={modalVisible} onClose={closeModal} backdrop="static">
        <CModalHeader>
          <CModalTitle>Add Warehouse</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {formError && (
            <CAlert color="danger" className="mb-3">
              {formError}
            </CAlert>
          )}
          <CForm onSubmit={handleSubmit}>
            <CFormLabel>Name</CFormLabel>
            <CFormInput name="name" value={form.name} onChange={handleChange} required />

            <div className="row g-3 mt-1">
              <div className="col-12">
                <CFormLabel>Address Line 1</CFormLabel>
                <CFormInput
                  name="address.line1"
                  value={form.address.line1}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <CFormLabel>City</CFormLabel>
                <CFormInput
                  name="address.city"
                  value={form.address.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <CFormLabel>Country</CFormLabel>
                <CFormInput
                  name="address.country"
                  value={form.address.country}
                  onChange={handleChange}
                />
              </div>
            </div>

            <hr className="my-3" />

            <div className="row g-3">
              <div className="col-md-6">
                <CFormLabel>Contact Person</CFormLabel>
                <CFormInput
                  name="contact.person"
                  value={form.contact.person}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <CFormLabel>Phone</CFormLabel>
                <CFormInput
                  name="contact.phone"
                  value={form.contact.phone}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-12">
                <CFormLabel>Email</CFormLabel>
                <CFormInput
                  type="email"
                  name="contact.email"
                  value={form.contact.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={closeModal}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* page styles */}
      <style>{`
        .warehouses-page .wp-toolbar {
          display:flex; align-items:flex-end; justify-content:space-between; gap:12px; margin-bottom:14px;
        }
        .warehouses-page .wp-toolbar .left .title {
          font-size:1.35rem; font-weight:800; line-height:1;
        }
        .warehouses-page .wp-toolbar .left .sub { margin-top:6px; }
        .warehouses-page .wp-toolbar .right { display:flex; gap:8px; align-items:center; }
        .warehouses-page .wp-toolbar .wp-search { min-width: 340px; }

        .warehouses-page .wp-card {
          background:#151a1f; border:1px solid #2a2f35; border-radius:14px; padding:12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.18);
        }
        .warehouses-page .wp-controls {
          display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px;
        }
        .warehouses-page .wp-table-wrap {
          border:1px solid #2a2f35; border-radius:12px; overflow:auto; max-height: 65vh;
        }
        .warehouses-page .wp-table { min-width: 980px; }
        .warehouses-page .sticky-head { position: sticky; top: 0; z-index: 2; background: #161b21; }
        .warehouses-page th[role="button"] { cursor:pointer; user-select:none; }
        .warehouses-page .th-actions { width: 110px; }
        .warehouses-page .th-tight { white-space:nowrap; width: 140px; }
        .warehouses-page .nowrap { white-space:nowrap; }
        .warehouses-page .wp-address { max-width: 360px; }
        .warehouses-page .wp-row { transition: background-color .12s ease, transform .05s ease; }
        .warehouses-page .wp-row:hover { background: rgba(13,110,253,0.10); }
        .warehouses-page .wp-pagination {
          display:flex; align-items:center; justify-content:space-between; padding:10px 4px 2px;
        }

        /* loading skeletons */
        .warehouses-page .skeleton-row .sk {
          height: 12px; width: 100%;
          background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.18), rgba(255,255,255,.08));
          background-size: 200% 100%;
          animation: sk 1.2s ease-in-out infinite;
          border-radius: 6px;
        }
        @keyframes sk { 0%{background-position: 200% 0} 100%{background-position: -200% 0} }
      `}</style>
    </CContainer>
  )
}

export default Warehouses
