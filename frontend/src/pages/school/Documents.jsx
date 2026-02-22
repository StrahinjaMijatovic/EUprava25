import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { createDocument, listDocuments } from '../../api/school'

const DOC_TYPES = [
  { value: 'potvrda_o_skolovanju', label: 'Potvrda o školovanju' },
  { value: 'izvod_iz_maticne_knjige', label: 'Izvod iz matične knjige' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'svjedocanstvo', label: 'Svjedočanstvo' },
  { value: 'preporuka', label: 'Preporuka' },
  { value: 'ostalo', label: 'Ostalo' },
]

export default function Documents() {
  const { user } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ document_type: 'potvrda_o_skolovanju', title: '', content: '', recipient_id: '' })

  const isStaff = ['nastavnik', 'administracija', 'admin'].includes(user?.role)

  const load = async () => {
    try {
      const res = await listDocuments()
      setDocs(res.data || [])
    } catch { setError('Greška pri učitavanju.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createDocument(form)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Greška.')
    }
  }

  const docTypeLabel = (type) => DOC_TYPES.find((d) => d.value === type)?.label || type

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Školska dokumenta</h1>
          <p className="page-subtitle">Uvjerenja, diplome, svjedočanstva</p>
        </div>
        {isStaff && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Zatvori' : '+ Izdaj dokument'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && isStaff && (
        <div className="card">
          <div className="card-title">Izdavanje dokumenta</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Tip dokumenta</label>
                <select value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })}>
                  {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Naslov</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Sadržaj dokumenta</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary">Izdaj</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Odustani</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <div className="spinner" /> : docs.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📄</div><p>Nema dokumenta.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Tip</th><th>Naslov</th><th>Sadržaj</th><th>Datum</th></tr></thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td><span className="badge badge-completed">{docTypeLabel(d.document_type)}</span></td>
                    <td>{d.title}</td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.content}</td>
                    <td>{d.created_at ? new Date(d.created_at).toLocaleDateString('sr-RS') : '—'}</td>
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
