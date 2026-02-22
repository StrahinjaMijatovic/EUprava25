import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { createHealthRecord, listHealthRecords, createLabResult, listLabResults, listPatients } from '../../api/health'

export default function HealthRecords() {
  const { user } = useAuth()
  const [tab, setTab] = useState('records')
  const [records, setRecords] = useState([])
  const [labResults, setLabResults] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [showLabForm, setShowLabForm] = useState(false)
  const [recordForm, setRecordForm] = useState({ patient_id: '', diagnosis: '', treatment: '', notes: '', visit_date: '' })
  const [labForm, setLabForm] = useState({ patient_id: '', test_name: '', result: '', reference_range: '', test_date: '' })

  const isDoctor = ['lekar', 'medicinska_sestra', 'administrator'].includes(user?.role)

  const load = async () => {
    setLoading(true)
    try {
      const [r, l] = await Promise.all([listHealthRecords(), listLabResults()])
      setRecords(r.data || [])
      setLabResults(l.data || [])
      if (isDoctor) {
        const pats = await listPatients()
        setPatients(pats.data || [])
      }
    } catch { setError('Greška pri učitavanju.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const submitRecord = async (e) => {
    e.preventDefault()
    try {
      await createHealthRecord(recordForm)
      setShowRecordForm(false)
      load()
    } catch (err) { setError(err.response?.data?.error || 'Greška.') }
  }

  const submitLab = async (e) => {
    e.preventDefault()
    try {
      await createLabResult(labForm)
      setShowLabForm(false)
      load()
    } catch (err) { setError(err.response?.data?.error || 'Greška.') }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">eKarton</h1>
          <p className="page-subtitle">Medicinska dokumentacija i laboratorijski nalazi</p>
        </div>
        {isDoctor && tab === 'records' && (
          <button className="btn btn-primary" onClick={() => setShowRecordForm(!showRecordForm)}>+ Novi unos</button>
        )}
        {isDoctor && tab === 'lab' && (
          <button className="btn btn-primary" onClick={() => setShowLabForm(!showLabForm)}>+ Novi nalaz</button>
        )}
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'records' ? 'active' : ''}`} onClick={() => setTab('records')}>Zdravstveni karton</button>
        <button className={`tab-btn ${tab === 'lab' ? 'active' : ''}`} onClick={() => setTab('lab')}>Laboratorijski nalazi</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {tab === 'records' && (
        <>
          {showRecordForm && isDoctor && (
            <div className="card">
              <div className="card-title">Novi zdravstveni unos</div>
              <form onSubmit={submitRecord}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Pacijent</label>
                    <select value={recordForm.patient_id} onChange={(e) => setRecordForm({ ...recordForm, patient_id: e.target.value })} required>
                      <option value="">Izaberite</option>
                      {patients.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Datum posjete</label>
                    <input type="date" value={recordForm.visit_date} onChange={(e) => setRecordForm({ ...recordForm, visit_date: e.target.value })} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Dijagnoza</label>
                    <input value={recordForm.diagnosis} onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Terapija</label>
                    <textarea value={recordForm.treatment} onChange={(e) => setRecordForm({ ...recordForm, treatment: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Napomene</label>
                    <textarea value={recordForm.notes} onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary">Sačuvaj</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRecordForm(false)}>Odustani</button>
                </div>
              </form>
            </div>
          )}
          <div className="card">
            {loading ? <div className="spinner" /> : records.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🩺</div><p>Nema zdravstvenih unosa.</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Datum</th><th>Dijagnoza</th><th>Terapija</th><th>Napomene</th></tr></thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td>{r.visit_date ? new Date(r.visit_date).toLocaleDateString('sr-RS') : '—'}</td>
                        <td><strong>{r.diagnosis}</strong></td>
                        <td>{r.treatment || '—'}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'lab' && (
        <>
          {showLabForm && isDoctor && (
            <div className="card">
              <div className="card-title">Novi laboratorijski nalaz</div>
              <form onSubmit={submitLab}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Pacijent</label>
                    <select value={labForm.patient_id} onChange={(e) => setLabForm({ ...labForm, patient_id: e.target.value })} required>
                      <option value="">Izaberite</option>
                      {patients.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Datum analize</label>
                    <input type="date" value={labForm.test_date} onChange={(e) => setLabForm({ ...labForm, test_date: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Naziv analize</label>
                    <input value={labForm.test_name} onChange={(e) => setLabForm({ ...labForm, test_name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Rezultat</label>
                    <input value={labForm.result} onChange={(e) => setLabForm({ ...labForm, result: e.target.value })} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Referentni opseg</label>
                    <input value={labForm.reference_range} onChange={(e) => setLabForm({ ...labForm, reference_range: e.target.value })} placeholder="npr. 3.5-5.5 mmol/L" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary">Sačuvaj</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowLabForm(false)}>Odustani</button>
                </div>
              </form>
            </div>
          )}
          <div className="card">
            {loading ? <div className="spinner" /> : labResults.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🔬</div><p>Nema laboratorijskih nalaza.</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Datum</th><th>Analiza</th><th>Rezultat</th><th>Ref. opseg</th></tr></thead>
                  <tbody>
                    {labResults.map((l) => (
                      <tr key={l.id}>
                        <td>{l.test_date ? new Date(l.test_date).toLocaleDateString('sr-RS') : '—'}</td>
                        <td><strong>{l.test_name}</strong></td>
                        <td>{l.result}</td>
                        <td>{l.reference_range || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  )
}
