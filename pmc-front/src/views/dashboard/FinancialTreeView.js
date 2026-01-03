import React, { useState } from 'react'
import { CCard, CCardHeader, CCardBody, CFormSelect } from '@coreui/react'

const mockData = [
  { name: 'Annual Budget 2025', categories: ['Salaries', 'Procurement', 'Projects'] },
  { name: 'Quarterly Report Q1', categories: ['Revenue', 'Expenses', 'Assets'] },
]

const FinancialTreeView = () => {
  const [selectedReport, setSelectedReport] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  return (
    <CCard className="border-0 shadow-sm">
      <CCardHeader className="bg-dark text-white">
        <strong>Financial Module Tree View</strong>
      </CCardHeader>
      <CCardBody>
        <CFormSelect
          value={selectedReport}
          onChange={(e) => setSelectedReport(e.target.value)}
          className="mb-3"
        >
          <option value="">Select Financial Report</option>
          {mockData.map((r) => (
            <option key={r.name}>{r.name}</option>
          ))}
        </CFormSelect>

        {selectedReport && (
          <CFormSelect
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="mb-3"
          >
            <option value="">Select Category</option>
            {mockData
              .find((r) => r.name === selectedReport)
              ?.categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
          </CFormSelect>
        )}

        {selectedCategory ? (
          <div className="p-4 border rounded bg-body-secondary">
            <strong>Financial Flow</strong>
            <div className="mt-2 text-muted">
              {selectedReport} → {selectedCategory} → Transactions → Audit Trail
            </div>
          </div>
        ) : (
          <p className="text-muted">Select a report and category to view flow.</p>
        )}
      </CCardBody>
    </CCard>
  )
}

export default FinancialTreeView
