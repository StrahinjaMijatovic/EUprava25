import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { createEnrollment, listEnrollments, updateEnrollmentStatus } from '../../api/school'

const STATUS_LABELS = { pending: 'Na čekanju', approved: 'Odobreno', rejected: 'Odbijeno' }

export default function Enrollments() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', date_of_birth: '', school_year: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = ['administracija', 'admin'].includes(user?.role)

  const load = async () => {
    try {
      const res = await listEnrollments()
      setEnrollments(res.data || [])
    } catch {
      setError('Greška pri učitavanju.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createEnrollment(form)
      setShowForm(false)
      setForm({ first_name: '', last_name: '', date_of_birth: '', school_year: '', notes: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Greška pri podnošenju.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatus = async (id, status) => {
    try {
      await updateEnrollmentStatus(id, { status })
      load()
    } catch {
      setError('Greška pri ažuriranju.')
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Upis u školu</h1>
          <p className="page-subtitle">Podnošenje i praćenje zahtjeva za upis</p>
        </div>
        {!isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Zatvori' : '+ Novi zahtjev'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-title">Novi zahtjev za upis</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Ime učenika</label>
                <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Prezime učenika</label>
                <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Datum rođenja</label>
                <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Školska godina</label>
                <input value={form.school_year} onChange={(e) => setForm({ ...form, school_year: e.target.value })} placeholder="npr. 2024/2025" required />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Napomena</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opcionalno" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Slanje...' : 'Podnesi zahtjev'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Odustani</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <div className="spinner" /> : (
          enrollments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p>Nema zahtjeva za upis.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ime</th>
                    <th>Prezime</th>
                    <th>Datum rođenja</th>
                    <th>Šk. godina</th>
                    <th>Status</th>
                    {isAdmin && <th>Akcija</th>}
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e) => (
                    <tr key={e.id}>
                      <td>{e.first_name}</td>
                      <td>{e.last_name}</td>
                      <td>{e.date_of_birth ? new Date(e.date_of_birth).toLocaleDateString('sr-RS') : '—'}</td>
                      <td>{e.school_year}</td>
                      <td>
                        <span className={`badge badge-${e.status}`}>
                          {STATUS_LABELS[e.status] || e.status}
                        </span>
                      </td>
                      {isAdmin && e.status === 'pending' && (
                        <td style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-success btn-sm" onClick={() => handleStatus(e.id, 'approved')}>Odobri</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleStatus(e.id, 'rejected')}>Odbij</button>
                        </td>
                      )}
                      {isAdmin && e.status !== 'pending' && <td>—</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </Layout>
  )
}
