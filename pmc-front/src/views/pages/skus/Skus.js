import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
  CContainer, CRow, CCol, CCard, CCardBody, CButton, CForm, CFormInput, CFormSelect,
  CInputGroup, CInputGroupText, CTable, CTableHead, CTableBody, CTableRow, CTableHeaderCell,
  CTableDataCell, CBadge, CSpinner, CPagination, CPaginationItem, CModal, CModalHeader,
  CModalTitle, CModalBody, CModalFooter, CAlert, CToaster, CToast, CToastBody, CListGroup, CListGroupItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilMagnifyingGlass, cilCloudUpload, cilPlus, cilTrash, cilSave, cilPencil, cilArrowCircleBottom,
  cilSortAscending, cilSortDescending, cilReload,
} from '@coreui/icons'

import skusService from '../../../services/skusService'

const Skus = () => {
  // ======= server-side paging
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)

  // ======= filters
  const [qInput, setQInput] = useState('')   // what user types
  const [q, setQ] = useState('')            // applied term (via Search button / Enter OR auto-clear)
  const [isActive, setIsActive] = useState('all') // 'all' | 'true' | 'false'
  const normalizedActive = useMemo(() => (
    isActive === 'true' ? true : isActive === 'false' ? false : undefined
  ), [isActive])

  // ======= data
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ======= sorting (client side, current page)
  const [sortField, setSortField] = useState('sku') // 'sku' | 'productName'
  const [sortDir, setSortDir] = useState('asc')

  // ======= import
  const [importing, setImporting] = useState(false)
  const [file, setFile] = useState(null)
  const [importStats, setImportStats] = useState(null)

  // ======= add/edit/delete modals
  const [addVisible, setAddVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [working, setWorking] = useState(false)
  const [selectedSku, setSelectedSku] = useState(null)

  // ======= toaster
  const [toasts, setToasts] = useState([])
  const pushToast = (msg, color = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, color, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }

  // ======= SUGGESTIONS (on-demand; not live)
  const [suggOpen, setSuggOpen] = useState(false)
  const [suggLoading, setSuggLoading] = useState(false)
  const [suggRows, setSuggRows] = useState([])

  const loadSuggestions = async () => {
    const term = qInput.trim()
    if (!term) { setSuggRows([]); setSuggOpen(false); return }
    setSuggLoading(true); setSuggOpen(true); setError('')
    try {
      const data = await skusService.search({
        q: term,
        limit: 8,
        mode: 'prefix',
        includeInactive: isActive !== 'true',
      })
      setSuggRows(Array.isArray(data?.results) ? data.results : [])
    } catch (e) {
      setSuggRows([])
      setError(e?.response?.data?.message || 'Suggestion search failed')
    } finally {
      setSuggLoading(false)
    }
  }

  const applySuggestion = (s) => {
    const term = s.sku || s.productName || ''
    setQInput(term)
    setSuggOpen(false)
    setQ(term)       // apply immediately
    setPage(1)
  }

  // ======= main fetch
  const fetchSkus = useCallback(async () => {
    setLoading(true); setError(''); setImportStats(null)
    try {
      const data = await skusService.list({
        q: q.trim() || undefined,
        page,
        limit,
        isActive: normalizedActive,
      })
      setRows(Array.isArray(data?.results) ? data.results : [])
      setTotal(data?.total || 0)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load SKUs')
    } finally {
      setLoading(false)
    }
  }, [q, page, limit, normalizedActive])

  // initial + whenever applied filters change
  useEffect(() => { fetchSkus() }, [fetchSkus])

  // ======= sort (client current page)
  const sortedRows = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = String(a[sortField] ?? '').toLowerCase()
      const bv = String(b[sortField] ?? '').toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [rows, sortField, sortDir])

  const handleSort = (field) => {
    if (!['sku', 'productName'].includes(field)) return
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  // ======= actions
  const onApplySearch = () => { setQ(qInput.trim()); setPage(1); setSuggOpen(false) }
  const onSearchKey = (e) => { if (e.key === 'Enter') onApplySearch() }

  // ⭐️ Auto-reset to "all SKUs" when the search box is cleared
  const handleSearchInputChange = (e) => {
    const v = e.target.value
    setQInput(v)
    setSuggOpen(false)
    if (v.trim() === '' && q !== '') {
      // apply empty query immediately -> fetch all
      setQ('')
      setPage(1)
    }
  }

  const handleImport = async (e) => {
    e.preventDefault()
    if (!file) { setError('Please choose an Excel file first'); return }
    setImporting(true)
    try {
      const res = await skusService.importExcel(file)
      setImportStats(res?.stats || null)
      pushToast(res?.message || 'Import completed', 'success')
      setFile(null)
      await fetchSkus()
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const openEdit = (row) => { setSelectedSku(row); setEditForm({ productName: row.productName || '' }); setEditVisible(true) }
  const openDelete = (row) => { setSelectedSku(row); setDeleteVisible(true) }

  const [editForm, setEditForm] = useState({ productName: '' })
  const [addForm, setAddForm] = useState({ sku: '', productName: '' })

  const handleAdd = async () => {
    if (!addForm.sku?.trim() || !addForm.productName?.trim()) { setError('Please fill SKU and Product Name'); return }
    setWorking(true)
    try {
      await skusService.add({ sku: addForm.sku.trim(), productName: addForm.productName.trim() })
      setAddVisible(false)
      setAddForm({ sku: '', productName: '' })
      pushToast('SKU added')
      if (page !== 1) setPage(1)
      await fetchSkus()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to add SKU')
    } finally {
      setWorking(false)
    }
  }

  const handleEdit = async () => {
    if (!editForm.productName?.trim()) { setError('Product name is required'); return }
    setWorking(true)
    try {
      await skusService.update(selectedSku._id, { productName: editForm.productName.trim() })
      setEditVisible(false)
      pushToast('SKU updated')
      await fetchSkus()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update SKU')
    } finally {
      setWorking(false)
    }
  }

  const handleDelete = async () => {
    setWorking(true)
    try {
      await skusService.remove(selectedSku._id)
      setDeleteVisible(false)
      pushToast('SKU deleted', 'secondary')
      const remaining = rows.length - 1
      if (remaining === 0 && page > 1) setPage((p) => p - 1)
      else await fetchSkus()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete SKU')
    } finally {
      setWorking(false)
    }
  }

  const exportCsv = () => {
    if (!sortedRows.length) { pushToast('Nothing to export', 'info'); return }
    const header = ['SKU', 'Product Name', 'Active']
    const lines = sortedRows.map((r) => [
      r.sku ?? '',
      (r.productName ?? '').replace(/\n/g, ' ').replace(/"/g, '""'),
      r.isActive ? 'true' : 'false',
    ])
    const csv =
      header.join(',') + '\n' +
      lines.map((row) => row.map((x) => (/,|"/.test(x) ? `"${x}"` : x)).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `skus_page${page}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ======= UI
  return (
    <CContainer fluid className="mt-4 px-0">
      {/* Toaster */}
      <CToaster placement="top-end" className="p-3">
        {toasts.map((t) => (
          <CToast key={t.id} autohide visible color={t.color}>
            <CToastBody>{t.msg}</CToastBody>
          </CToast>
        ))}
      </CToaster>

      <CRow className="mb-3 align-items-end g-2">
        <CCol md={5}>
          <label className="form-label">Search</label>
          <CInputGroup size="sm" className="position-relative">
            <CInputGroupText><CIcon icon={cilMagnifyingGlass} /></CInputGroupText>
            <CFormInput
              placeholder="Search by SKU or product name"
              value={qInput}
              onChange={handleSearchInputChange}   
              onKeyDown={onSearchKey}
            />
            <CButton size="sm" color="primary" onClick={onApplySearch}>Search</CButton>
            <CButton size="sm" color="secondary" variant="outline" onClick={loadSuggestions}>
              {suggLoading ? <CSpinner size="sm" /> : 'Suggestions'}
            </CButton>
          </CInputGroup>

          {/* Suggestions dropdown (on-demand; not live) */}
          {suggOpen && (
            <div className="mt-1">
              {suggLoading ? (
                <div className="text-muted small px-2 py-1">Loading…</div>
              ) : (
                <CListGroup>
                  {suggRows.length ? suggRows.map((s) => (
                    <CListGroupItem key={s.id} role="button" onClick={() => applySuggestion(s)}>
                      <div className="fw-semibold">{s.sku}</div>
                      <div className="text-muted small">{s.productName}</div>
                    </CListGroupItem>
                  )) : (
                    <CListGroupItem disabled className="text-muted small">No suggestions</CListGroupItem>
                  )}
                </CListGroup>
              )}
            </div>
          )}
        </CCol>

        <CCol md={2}>
          <label className="form-label">Status</label>
          <CFormSelect
            size="sm"
            value={isActive}
            onChange={(e) => { setIsActive(e.target.value); setPage(1) }}
          >
            <option value="all">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </CFormSelect>
        </CCol>

        <CCol md={2}>
          <label className="form-label">Per Page</label>
          <CFormSelect
            size="sm"
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </CFormSelect>
        </CCol>

        <CCol md={3} className="d-flex gap-2 justify-content-md-end">
          <CForm onSubmit={handleImport} className="d-flex gap-2">
            <CButton size="sm" color="outline-secondary" onClick={() => document.getElementById('skuImportInput').click()}>
              <CIcon icon={cilCloudUpload} className="me-1" />
              {file ? file.name : 'Import Excel'}
            </CButton>
            <input
              id="skuImportInput"
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              hidden
            />
            <CButton size="sm" color="primary" type="submit" disabled={!file || importing}>
              {importing ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilCloudUpload} className="me-1" />}
              Upload
            </CButton>
          </CForm>

          <CButton size="sm" color="success" onClick={() => setAddVisible(true)}>
            <CIcon icon={cilPlus} className="me-1" />
            Add SKU
          </CButton>

          <CButton size="sm" color="dark" variant="outline" onClick={exportCsv}>
            <CIcon icon={cilArrowCircleBottom} className="me-1" />
            Export CSV
          </CButton>

          <CButton size="sm" color="secondary" variant="ghost" onClick={fetchSkus} title="Reload">
            <CIcon icon={cilReload} />
          </CButton>
        </CCol>
      </CRow>

      {importStats && (
        <CAlert color="info" className="mb-3">
          <strong>Import:</strong> total {importStats.total}, upserted {importStats.upserted}, modified {importStats.modified}
        </CAlert>
      )}
      {error && <CAlert color="danger" className="mb-3">{error}</CAlert>}

      <CCard>
        <CCardBody className="px-0">
          {loading ? (
            <div className="text-center py-5"><CSpinner color="primary" /></div>
          ) : (
            <>
              <div className="table-responsive px-3">
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      {[
                        { key: 'sku', label: 'SKU' },
                        { key: 'productName', label: 'Product Name' },
                        { key: 'isActive', label: 'Active' },
                        { key: 'actions', label: 'Actions' },
                      ].map((col) => (
                        <CTableHeaderCell
                          key={col.key}
                          onClick={() => ['sku', 'productName'].includes(col.key) && handleSort(col.key)}
                          className={['sku', 'productName'].includes(col.key) ? 'cursor-pointer' : ''}
                        >
                          {col.label}
                          {sortField === col.key && (
                            <CIcon icon={sortDir === 'asc' ? cilSortAscending : cilSortDescending} className="ms-1" />
                          )}
                        </CTableHeaderCell>
                      ))}
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {sortedRows.length ? sortedRows.map((r) => (
                      <CTableRow key={r._id}>
                        <CTableDataCell className="fw-semibold">{r.sku}</CTableDataCell>
                        <CTableDataCell>{r.productName}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={r.isActive ? 'success' : 'secondary'}>
                            {r.isActive ? 'Active' : 'Inactive'}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="d-flex gap-2">
                          <CButton size="sm" color="info" variant="outline" onClick={() => openEdit(r)}>
                            <CIcon icon={cilPencil} className="me-1" />
                            Edit
                          </CButton>
                          <CButton size="sm" color="danger" variant="outline" onClick={() => openDelete(r)}>
                            <CIcon icon={cilTrash} className="me-1" />
                            Delete
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    )) : (
                      <CTableRow>
                        <CTableDataCell colSpan={4} className="text-center py-5 text-muted">
                          No SKUs found
                        </CTableDataCell>
                      </CTableRow>
                    )}
                  </CTableBody>
                </CTable>
              </div>

              {/* Pagination */}
              {Math.ceil(total / limit) > 1 && (
                <CRow className="mt-3">
                  <CCol className="d-flex justify-content-center">
                    <CPagination size="sm">
                      <CPaginationItem disabled={page === 1} onClick={() => setPage(1)}>&laquo;</CPaginationItem>
                      <CPaginationItem disabled={page === 1} onClick={() => setPage((p) => p - 1)}>&lsaquo;</CPaginationItem>
                      <CPaginationItem active>{page}</CPaginationItem>
                      <CPaginationItem disabled={page === Math.ceil(total / limit)} onClick={() => setPage((p) => p + 1)}>&rsaquo;</CPaginationItem>
                      <CPaginationItem disabled={page === Math.ceil(total / limit)} onClick={() => setPage(Math.ceil(total / limit))}>&raquo;</CPaginationItem>
                    </CPagination>
                  </CCol>
                </CRow>
              )}
            </>
          )}
        </CCardBody>
      </CCard>

      {/* Add Modal */}
      <CModal visible={addVisible} onClose={() => setAddVisible(false)}>
        <CModalHeader closeButton><CModalTitle>Add SKU</CModalTitle></CModalHeader>
        <CModalBody>
          <CRow className="g-3">
            <CCol md={6}>
              <CFormInput
                label="SKU *"
                placeholder="e.g., LS-001"
                value={addForm.sku}
                onChange={(e) => setAddForm((s) => ({ ...s, sku: e.target.value }))}
              />
            </CCol>
            <CCol md={12}>
              <CFormInput
                label="Product Name *"
                placeholder="Product name"
                value={addForm.productName}
                onChange={(e) => setAddForm((s) => ({ ...s, productName: e.target.value }))}
              />
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setAddVisible(false)}>Cancel</CButton>
          <CButton color="primary" disabled={working} onClick={handleAdd}>
            {working ? <CSpinner size="sm" /> : <CIcon icon={cilSave} className="me-1" />}
            Save
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Edit Modal */}
      <CModal visible={editVisible} onClose={() => setEditVisible(false)}>
        <CModalHeader closeButton><CModalTitle>Edit SKU</CModalTitle></CModalHeader>
        <CModalBody>
          <CAlert color="secondary" className="py-2"><strong>SKU:</strong> {selectedSku?.sku}</CAlert>
          <CFormInput
            label="Product Name *"
            value={editForm.productName}
            onChange={(e) => setEditForm({ productName: e.target.value })}
          />
          <small className="text-muted d-block mt-2">Only Product Name is editable via this endpoint.</small>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setEditVisible(false)}>Close</CButton>
          <CButton color="primary" disabled={working} onClick={handleEdit}>
            {working ? <CSpinner size="sm" /> : <CIcon icon={cilSave} className="me-1" />}
            Update
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Delete Modal */}
      <CModal visible={deleteVisible} onClose={() => setDeleteVisible(false)}>
        <CModalHeader closeButton><CModalTitle>Delete SKU</CModalTitle></CModalHeader>
        <CModalBody>
          Are you sure you want to delete <strong>{selectedSku?.sku}</strong>?
          <div className="text-muted mt-1">{selectedSku?.productName}</div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteVisible(false)}>Cancel</CButton>
          <CButton color="danger" disabled={working} onClick={handleDelete}>
            {working ? <CSpinner size="sm" /> : <CIcon icon={cilTrash} className="me-1" />}
            Delete
          </CButton>
        </CModalFooter>
      </CModal>

      <style>{`.cursor-pointer { cursor: pointer; }`}</style>
    </CContainer>
  )
}

export default Skus
