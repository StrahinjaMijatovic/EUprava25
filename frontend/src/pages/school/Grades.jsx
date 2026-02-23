import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { createGrade, listGrades, deleteGrade, createAttendance, listAttendance, listStudents, listSubjects } from '../../api/school'

export default function Grades() {
  const { user } = useAuth()
  const [tab, setTab] = useState('grades')
  const [grades, setGrades] = useState([])
  const [attendance, setAttendance] = useState([])
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showGradeForm, setShowGradeForm] = useState(false)
  const [showAttForm, setShowAttForm] = useState(false)
  const [gradeForm, setGradeForm] = useState({ student_id: '', subject_id: '', value: '', comment: '' })
  const [attForm, setAttForm] = useState({ student_id: '', subject_id: '', date: '', status: 'present', note: '' })

  const isTeacher = ['nastavnik', 'administracija', 'admin'].includes(user?.role)

  // Lookup mape za prikaz imena
  const studentById = React.useMemo(() => Object.fromEntries(students.map((s) => [s.id, s])), [students])
  const subjectById = React.useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s])), [subjects])

  const load = async () => {
    setLoading(true)
    setError('')
    const results = await Promise.allSettled([
      listGrades(),
      listAttendance(),
      listStudents(),
      listSubjects(),
    ])
    const [g, a, st, su] = results
    if (g.status  === 'fulfilled') setGrades(g.value.data || [])
    if (a.status  === 'fulfilled') setAttendance(a.value.data || [])
    if (st.status === 'fulfilled') setStudents(st.value.data || [])
    else setError(`Greška pri učitavanju učenika: ${st.reason?.response?.data?.error || st.reason?.message || 'nepoznata greška'}`)
    if (su.status === 'fulfilled') setSubjects(su.value.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const submitGrade = async (e) => {
    e.preventDefault()
    try {
      await createGrade({ ...gradeForm, value: parseInt(gradeForm.value) })
      setShowGradeForm(false)
      setGradeForm({ student_id: '', subject_id: '', value: '', comment: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Greška.')
    }
  }

  const submitAtt = async (e) => {
    e.preventDefault()
    try {
      await createAttendance(attForm)
      setShowAttForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Greška.')
    }
  }

  const handleDeleteGrade = async (id) => {
    if (!confirm('Obrisati ocjenu?')) return
    try {
      await deleteGrade(id)
      load()
    } catch { setError('Greška pri brisanju.') }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dnevnik</h1>
          <p className="page-subtitle">Ocjene i evidencija prisustva</p>
        </div>
        {isTeacher && tab === 'grades' && (
          <button className="btn btn-primary" onClick={() => setShowGradeForm(!showGradeForm)}>+ Unesi ocjenu</button>
        )}
        {isTeacher && tab === 'attendance' && (
          <button className="btn btn-primary" onClick={() => setShowAttForm(!showAttForm)}>+ Evidentira prisustvo</button>
        )}
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'grades' ? 'active' : ''}`} onClick={() => setTab('grades')}>Ocjene</button>
        <button className={`tab-btn ${tab === 'attendance' ? 'active' : ''}`} onClick={() => setTab('attendance')}>Prisustvo</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {tab === 'grades' && (
        <>
          {showGradeForm && (
            <div className="card">
              <div className="card-title">Unos ocjene</div>
              <form onSubmit={submitGrade}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Učenik</label>
                    <select value={gradeForm.student_id} onChange={(e) => setGradeForm({ ...gradeForm, student_id: e.target.value })} required>
                      <option value="">
                        {students.length === 0 ? '— Nema upisanih učenika —' : 'Izaberite učenika'}
                      </option>
                      {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                    </select>
                    {students.length === 0 && (
                      <small style={{ color: '#dc2626', fontSize: 12, display: 'block', marginTop: 4 }}>
                        Nema učenika. Admin mora odobriti upis putem "Odobri i upiši učenika".
                      </small>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Predmet</label>
                    <select value={gradeForm.subject_id} onChange={(e) => setGradeForm({ ...gradeForm, subject_id: e.target.value })} required>
                      <option value="">Izaberite predmet</option>
                      {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ocjena (1-5)</label>
                    <input type="number" min="1" max="5" value={gradeForm.value} onChange={(e) => setGradeForm({ ...gradeForm, value: e.target.value })} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Napomena (opcionalno)</label>
                    <input value={gradeForm.comment} onChange={(e) => setGradeForm({ ...gradeForm, comment: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary">Sačuvaj</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowGradeForm(false)}>Odustani</button>
                </div>
              </form>
            </div>
          )}
          <div className="card">
            {loading ? <div className="spinner" /> : grades.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📊</div><p>Nema ocjena.</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Učenik</th><th>Predmet</th><th>Ocjena</th><th>Datum</th><th>Napomena</th>{isTeacher && <th>Akcija</th>}</tr></thead>
                  <tbody>
                    {grades.map((g) => {
                      const st = studentById[g.student_id]
                      const su = subjectById[g.subject_id]
                      return (
                        <tr key={g.id}>
                          <td>{st ? `${st.first_name} ${st.last_name}` : g.student_id}</td>
                          <td>{su ? su.name : g.subject_id}</td>
                          <td><strong style={{ fontSize: '1.1em', color: g.value >= 3 ? 'var(--success)' : 'var(--danger)' }}>{g.value}</strong></td>
                          <td>{g.grade_date ? new Date(g.grade_date).toLocaleDateString('sr-RS') : '—'}</td>
                          <td>{g.comment || '—'}</td>
                          {isTeacher && <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteGrade(g.id)}>Briši</button></td>}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'attendance' && (
        <>
          {showAttForm && (
            <div className="card">
              <div className="card-title">Evidencija prisustva</div>
              <form onSubmit={submitAtt}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Učenik</label>
                    <select value={attForm.student_id} onChange={(e) => setAttForm({ ...attForm, student_id: e.target.value })} required>
                      <option value="">Izaberite</option>
                      {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Predmet</label>
                    <select value={attForm.subject_id} onChange={(e) => setAttForm({ ...attForm, subject_id: e.target.value })} required>
                      <option value="">Izaberite</option>
                      {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Datum</label>
                    <input type="date" value={attForm.date} onChange={(e) => setAttForm({ ...attForm, date: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={attForm.status} onChange={(e) => setAttForm({ ...attForm, status: e.target.value })}>
                      <option value="present">Prisutan</option>
                      <option value="absent">Odsutan</option>
                      <option value="late">Zakasnio</option>
                      <option value="excused">Opravdano</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary">Sačuvaj</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAttForm(false)}>Odustani</button>
                </div>
              </form>
            </div>
          )}
          <div className="card">
            {loading ? <div className="spinner" /> : attendance.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📅</div><p>Nema evidencije prisustva.</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Učenik</th><th>Predmet</th><th>Datum</th><th>Status</th></tr></thead>
                  <tbody>
                    {attendance.map((a) => {
                      const st = studentById[a.student_id]
                      const su = subjectById[a.subject_id]
                      return (
                      <tr key={a.id}>
                        <td>{st ? `${st.first_name} ${st.last_name}` : a.student_id}</td>
                        <td>{su ? su.name : a.subject_id}</td>
                        <td>{a.date ? new Date(a.date).toLocaleDateString('sr-RS') : '—'}</td>
                        <td>
                          <span className={`badge ${a.status === 'present' ? 'badge-approved' : a.status === 'absent' ? 'badge-rejected' : 'badge-pending'}`}>
                            {a.status === 'present' ? 'Prisutan' : a.status === 'absent' ? 'Odsutan' : a.status === 'late' ? 'Zakasnio' : 'Opravdano'}
                          </span>
                        </td>
                      </tr>
                      )
                    })}
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
