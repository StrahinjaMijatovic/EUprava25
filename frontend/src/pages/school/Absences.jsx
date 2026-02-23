import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { createAbsence, listAbsences, updateAbsenceStatus } from '../../api/school'
import { listMedicalCertificates } from '../../api/health'

const STATUS_LABELS = { pending: 'Na čekanju', approved: 'Opravdano', rejected: 'Neopravdano' }

export default function Absences() {
  const { user } = useAuth()
  const [absences, setAbsences] = useState([])
  const [medCerts, setMedCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ from_date: '', to_date: '', reason: '', document_url: '', med_cert_id: '' })

  // Mapa cert.id -> cert objekat za brzo traženje u tabeli
  const certById = React.useMemo(
    () => Object.fromEntries(medCerts.map((c) => [c.id, c])),
    [medCerts]
  )

  const CERT_TYPE_LABELS = { sport: 'Za fizičko', bolovanje: 'Bolovanje', opste: 'Opšti pregled', school: 'Za školu' }

  const isStaff = ['nastavnik', 'administracija', 'admin'].includes(user?.role)

  const load = async () => {
    try {
      const res = await listAbsences()
      setAbsences(res.data || [])
      try {
        const certs = await listMedicalCertificates()
        setMedCerts(certs.data || [])
      } catch { /* health service optional */ }
    } catch { setError('Greška pri učitavanju.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createAbsence(form)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Greška.')
    }
  }

  const handleStatus = async (id, status) => {
    try {
      await updateAbsenceStatus(id, { status })
      load()
    } catch { setError('Greška pri ažuriranju.') }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Opravdanje izostanaka</h1>
          <p className="page-subtitle">Podnošenje ljekarski i roditeljskih opravdanja</p>
        </div>
        {!isStaff && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Zatvori' : '+ Podnesi opravdanje'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-title">Novo opravdanje</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Datum od</label>
                <input type="date" value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Datum do</label>
                <input type="date" value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} required />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Razlog izostanka</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Opišite razlog..." required />
              </div>
              {medCerts.length > 0 && (
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Medicinska potvrda iz zdravstvenog kartona (opcionalno)</label>
                  <select
                    value={form.med_cert_id}
                    onChange={(e) => setForm({ ...form, med_cert_id: e.target.value, document_url: e.target.value })}
                  >
                    <option value="">— Bez potvrde —</option>
                    {medCerts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {CERT_TYPE_LABELS[c.type] || c.type} — važi do {c.valid_to ? new Date(c.valid_to).toLocaleDateString('sr-RS') : '?'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Ili URL dokumenta (opcionalno)</label>
                <input value={form.document_url} onChange={(e) => setForm({ ...form, document_url: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary">Podnesi</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Odustani</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <div className="spinner" /> : absences.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📝</div><p>Nema podnesenih opravdanja.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Od</th><th>Do</th><th>Razlog</th><th>Dokument</th><th>Status</th>{isStaff && <th>Akcija</th>}</tr>
              </thead>
              <tbody>
                {absences.map((a) => (
                  <tr key={a.id}>
                    <td>{a.from_date ? new Date(a.from_date).toLocaleDateString('sr-RS') : '—'}</td>
                    <td>{a.to_date ? new Date(a.to_date).toLocaleDateString('sr-RS') : '—'}</td>
                    <td>{a.reason}</td>
                    <td>
                      {(() => {
                        const cert = a.document_url && certById[a.document_url]
                        if (cert) {
                          const active = cert.valid_to && new Date(cert.valid_to) >= new Date()
                          return (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              background: '#eff6ff', border: '1px solid #bfdbfe',
                              borderRadius: 6, padding: '2px 8px', fontSize: 13, color: '#1d4ed8'
                            }}>
                              🏥 {CERT_TYPE_LABELS[cert.type] || cert.type}
                              <span style={{ color: active ? '#16a34a' : '#dc2626', fontSize: 11 }}>
                                ({active ? 'aktivna' : 'istekla'})
                              </span>
                            </span>
                          )
                        }
                        if (a.document_url?.startsWith('http')) {
                          return <a href={a.document_url} target="_blank" rel="noreferrer">Prikaži</a>
                        }
                        return '—'
                      })()}
                    </td>
                    <td><span className={`badge badge-${a.status}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
                    {isStaff && a.status === 'pending' && (
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleStatus(a.id, 'approved')}>Opravdaj</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleStatus(a.id, 'rejected')}>Odbij</button>
                      </td>
                    )}
                    {isStaff && a.status !== 'pending' && <td>—</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
