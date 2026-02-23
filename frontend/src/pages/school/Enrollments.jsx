import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { createEnrollment, listEnrollments, updateEnrollmentStatus, createStudent, listClasses } from '../../api/school'
import { listMedicalCertificates, getMedicalCertificate } from '../../api/health'

const STATUS_LABELS     = { pending: 'Na čekanju', approved: 'Odobreno', rejected: 'Odbijeno' }
const CERT_TYPE_LABELS  = { sport: 'Za fizičko', bolovanje: 'Bolovanje', opste: 'Opšti pregled', school: 'Za školu' }
const emptyForm         = { first_name: '', last_name: '', date_of_birth: '', school_year: '', notes: '', health_cert_id: '' }

export default function Enrollments() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [medCerts, setMedCerts]       = useState([])
  const [certDetails, setCertDetails] = useState({})
  const [classes, setClasses]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  // Forma za novu prijavu
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Panel za odobravanje — čuva cijeli enrollment objekat
  const [approvingEnr, setApprovingEnr]     = useState(null)
  const [approveForm, setApproveForm]       = useState({ user_id: '', class_id: '' })
  const [approveError, setApproveError]     = useState('')
  const [approveSaving, setApproveSaving]   = useState(false)

  const isAdmin  = ['administracija', 'admin'].includes(user?.role)
  const canApply = ['ucenik', 'roditelj'].includes(user?.role)

  const certById = React.useMemo(
    () => ({ ...certDetails, ...Object.fromEntries(medCerts.map((c) => [c.id, c])) }),
    [medCerts, certDetails]
  )
  const selectedCert = form.health_cert_id ? certById[form.health_cert_id] : null
  const activeCerts  = medCerts.filter((c) => c.valid_to && new Date(c.valid_to) >= new Date())

  const load = async () => {
    try {
      const res  = await listEnrollments()
      const list = res.data || []
      setEnrollments(list)

      if (canApply) {
        try { setMedCerts((await listMedicalCertificates()).data || []) } catch { /* optional */ }
      }

      if (isAdmin) {
        try { setClasses((await listClasses()).data || []) } catch { /* optional */ }
        try {
          const ids = [...new Set(list.map((e) => e.health_cert_id).filter(Boolean))]
          const fetched = {}
          await Promise.all(ids.map(async (id) => {
            try { fetched[id] = (await getMedicalCertificate(id)).data } catch { /* ignore */ }
          }))
          setCertDetails(fetched)
        } catch { /* optional */ }
      }
    } catch { setError('Greška pri učitavanju.') }
    finally   { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // Podnošenje nove prijave
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.health_cert_id) { setError('Potrebno je priložiti važeći lekarski pregled.'); return }
    setError('')
    setSubmitting(true)
    try {
      await createEnrollment(form)
      setShowForm(false)
      setForm(emptyForm)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Greška pri podnošenju.')
    } finally { setSubmitting(false) }
  }

  // Otvori panel za odobravanje
  const startApprove = (enr) => {
    setApprovingEnr(enr)
    setApproveError('')
    setApproveForm({ user_id: enr.parent_user_id || '', class_id: classes[0]?.id || '' })
    // Scroll to panel
    setTimeout(() => document.getElementById('approve-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  // Potvrdi odobravanje
  const handleApprove = async () => {
    setApproveError('')
    if (!approveForm.user_id) { setApproveError('User ID učenika je obavezan.'); return }
    setApproveSaving(true)
    try {
      await createStudent({
        user_id:        approveForm.user_id,
        first_name:     approvingEnr.first_name,
        last_name:      approvingEnr.last_name,
        date_of_birth:  approvingEnr.date_of_birth
          ? new Date(approvingEnr.date_of_birth).toISOString().split('T')[0]
          : '',
        class_id:       approveForm.class_id,
        parent_user_id: approvingEnr.parent_user_id || '',
      })
      // Ažuriraj status samo ako još nije odobren
      if (approvingEnr.status !== 'approved') {
        const payload = { status: 'approved' }
        if (approvingEnr.health_cert_id) {
          payload.health_cert_verified = true
          payload.health_cert_id = approvingEnr.health_cert_id
        }
        await updateEnrollmentStatus(approvingEnr.id, payload)
      }
      setApprovingEnr(null)
      load()
    } catch (err) {
      setApproveError(err.response?.data?.error || 'Greška pri odobravanju.')
    } finally { setApproveSaving(false) }
  }

  const handleReject = async (id) => {
    try { await updateEnrollmentStatus(id, { status: 'rejected' }); load() }
    catch { setError('Greška pri odbijanju.') }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Upis u školu</h1>
          <p className="page-subtitle">Podnošenje i praćenje zahtjeva za upis</p>
        </div>
        {canApply && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Zatvori' : '+ Novi zahtjev'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ── Forma za novu prijavu ── */}
      {showForm && canApply && (
        <div className="card">
          <div className="card-title">Novi zahtjev za upis</div>

          {medCerts.length === 0 ? (
            <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <strong style={{ color: '#854d0e' }}>Potreban lekarski pregled</strong>
                <p style={{ margin: '4px 0 0', color: '#713f12', fontSize: 14 }}>
                  Idi na stranicu "Lekarski" i registruj se, pa zatraži potvrdu od lekara.
                </p>
              </div>
            </div>
          ) : activeCerts.length === 0 ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 20 }}>❌</span>
              <strong style={{ color: '#991b1b' }}>Lekarski pregled istekao — molimo obnovite.</strong>
            </div>
          ) : null}

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
                <input value={form.school_year} onChange={(e) => setForm({ ...form, school_year: e.target.value })} placeholder="npr. 2025/2026" required />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Lekarski pregled <span style={{ color: '#dc2626' }}>*</span></label>
                {medCerts.length === 0 ? (
                  <div style={{ padding: '10px 12px', background: '#f3f4f6', borderRadius: 6, color: '#6b7280', fontSize: 14 }}>
                    Nema dostupnih lekarskih pregleda
                  </div>
                ) : (
                  <select value={form.health_cert_id} onChange={(e) => setForm({ ...form, health_cert_id: e.target.value })} required>
                    <option value="">— Odaberite lekarski pregled —</option>
                    {medCerts.map((c) => {
                      const active = c.valid_to && new Date(c.valid_to) >= new Date()
                      return (
                        <option key={c.id} value={c.id} disabled={!active}>
                          {CERT_TYPE_LABELS[c.type] || c.type} — važi do {c.valid_to ? new Date(c.valid_to).toLocaleDateString('sr-RS') : '?'}{!active ? ' (istekao)' : ''}
                        </option>
                      )
                    })}
                  </select>
                )}
                {selectedCert && (
                  <div style={{ marginTop: 8, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span>✅</span>
                    <div style={{ fontSize: 14 }}>
                      <strong style={{ color: '#15803d' }}>Lekarski priložen</strong>
                      <div style={{ color: '#166534' }}>
                        {selectedCert.patient_name} — {CERT_TYPE_LABELS[selectedCert.type] || selectedCert.type}, važi do {selectedCert.valid_to ? new Date(selectedCert.valid_to).toLocaleDateString('sr-RS') : '?'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Napomena</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opcionalno" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" disabled={submitting || !form.health_cert_id}>
                {submitting ? 'Slanje...' : 'Podnesi zahtjev'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Odustani</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Panel za odobravanje (van tabele!) ── */}
      {approvingEnr && (
        <div id="approve-panel" className="card" style={{ border: '2px solid #22c55e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#15803d' }}>
              ✅ Upis učenika: {approvingEnr.first_name} {approvingEnr.last_name}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setApprovingEnr(null)}>✕ Zatvori</button>
          </div>

          {approveError && <div className="alert alert-error">{approveError}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>User ID učenika <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                value={approveForm.user_id}
                onChange={(e) => setApproveForm({ ...approveForm, user_id: e.target.value })}
                placeholder="UUID korisničkog naloga (ucenik)"
              />
              <small style={{ color: '#6b7280', fontSize: 12, display: 'block', marginTop: 4 }}>
                Ako je učenik sam podnio prijavu, ID je već popunjen.
              </small>
            </div>
            <div className="form-group">
              <label>Razred <span style={{ color: '#6b7280', fontSize: 12 }}>(opcionalno)</span></label>
              {classes.length === 0 ? (
                <div style={{ padding: '10px 12px', background: '#f3f4f6', borderRadius: 6, fontSize: 13, color: '#6b7280', border: '1px solid #e5e7eb' }}>
                  Nema razreda — možete dodijeliti razred učeniku kasnije.
                </div>
              ) : (
                <select value={approveForm.class_id} onChange={(e) => setApproveForm({ ...approveForm, class_id: e.target.value })}>
                  <option value="">— Bez razreda (dodijeliti kasnije) —</option>
                  {classes.map((cl) => (
                    <option key={cl.id} value={cl.id}>{cl.name} (god. {cl.year})</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-primary" onClick={handleApprove} disabled={approveSaving}>
              {approveSaving ? 'Upisivanje...' : '✔ Odobri i upiši učenika'}
            </button>
            <button className="btn btn-secondary" onClick={() => setApprovingEnr(null)}>Odustani</button>
          </div>
        </div>
      )}

      {/* ── Tabela prijava ── */}
      <div className="card">
        {loading ? (
          <div className="spinner" />
        ) : enrollments.length === 0 ? (
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
                  <th>Lekarski</th>
                  <th>Status</th>
                  {isAdmin && <th>Akcija</th>}
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enr) => {
                  const cert       = enr.health_cert_id ? certById[enr.health_cert_id] : null
                  const certActive = cert?.valid_to && new Date(cert.valid_to) >= new Date()
                  const isSelected = approvingEnr?.id === enr.id
                  return (
                    <tr key={enr.id} style={isSelected ? { background: '#f0fdf4' } : {}}>
                      <td>{enr.first_name}</td>
                      <td>{enr.last_name}</td>
                      <td>{enr.date_of_birth ? new Date(enr.date_of_birth).toLocaleDateString('sr-RS') : '—'}</td>
                      <td>{enr.school_year}</td>
                      <td>
                        {cert ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '2px 8px', fontSize: 13, color: '#1d4ed8' }}>
                            🏥 {CERT_TYPE_LABELS[cert.type] || cert.type}
                            <span style={{ color: certActive ? '#16a34a' : '#dc2626', fontSize: 11 }}>
                              ({certActive ? 'aktivna' : 'istekla'})
                            </span>
                          </span>
                        ) : enr.health_cert_id ? (
                          <span style={{ color: '#9ca3af', fontSize: 13 }}>…</span>
                        ) : (
                          <span style={{ color: '#dc2626', fontSize: 13 }}>⚠ Nije priložen</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${enr.status}`}>
                          {STATUS_LABELS[enr.status] || enr.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          {enr.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => startApprove(enr)}
                              >
                                Odobri
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleReject(enr.id)}>
                                Odbij
                              </button>
                            </div>
                          ) : enr.status === 'approved' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ fontSize: 12, color: '#16a34a' }}>✔ Odobren</span>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: 11 }}
                                onClick={() => startApprove(enr)}
                              >
                                + Kreiraj učenika
                              </button>
                            </div>
                          ) : '—'}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
