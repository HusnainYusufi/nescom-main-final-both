// src/views/pages/production/ConfigurationCategories.js
import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import projectCategoryService from '../../../services/projectCategoryService'

const ConfigurationCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return categories.filter((c) =>
      [c.name, c.description].some((v) =>
        (v || '').toString().toLowerCase().includes(search.toLowerCase()),
      ),
    )
  }, [categories, search])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await projectCategoryService.getAll()
      setCategories(
        (data || []).map((c, idx) => ({
          id: c._id || c.id || `cat-${idx + 1}`,
          name: c.name || c.title || 'Category',
          description: c.description || c.notes || '',
        })),
      )
    } catch (err) {
      setError(err?.message || 'Unable to load categories.')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Category name is required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const created = await projectCategoryService.add({
        name: form.name.trim(),
        description: form.description || undefined,
      })
      setCategories((prev) => [
        {
          id: created._id || created.id || `cat-${Date.now()}`,
          name: created.name || form.name.trim(),
          description: created.description || form.description || '',
        },
        ...prev,
      ])
      setForm({ name: '', description: '' })
    } catch (err) {
      setError(err?.message || 'Failed to create category.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <CRow className="g-4">
      <CCol md={4}>
        <CCard className="shadow-sm border-0">
          <CCardHeader className="bg-body-secondary fw-semibold">Add Category</CCardHeader>
          <CCardBody>
            {error && (
              <CAlert color="danger" className="mb-3">
                {error}
              </CAlert>
            )}
            <CForm onSubmit={handleSubmit} className="d-grid gap-3">
              <CFormInput
                label="Category name*"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <CFormInput
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional"
              />
              <div className="d-flex justify-content-between">
                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={() => setForm({ name: '', description: '' })}
                  type="button"
                >
                  Reset
                </CButton>
                <CButton color="primary" type="submit" disabled={saving}>
                  {saving ? <CSpinner size="sm" /> : 'Save'}
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol md={8}>
        <CCard className="shadow-sm border-0">
          <CCardHeader className="d-flex justify-content-between align-items-center bg-body-secondary">
            <h6 className="mb-0">Categories</h6>
            <CFormInput
              size="sm"
              placeholder="Search..."
              style={{ maxWidth: '260px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CCardHeader>
          <CCardBody className="p-0">
            {loading ? (
              <div className="text-center py-4">
                <CSpinner color="primary" />
              </div>
            ) : (
              <CTable responsive hover className="mb-0">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Description</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filtered.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={2} className="text-center text-body-secondary py-4">
                        No categories yet.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    filtered.map((cat) => (
                      <CTableRow key={cat.id}>
                        <CTableDataCell className="fw-semibold">{cat.name}</CTableDataCell>
                        <CTableDataCell>{cat.description || '—'}</CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ConfigurationCategories

