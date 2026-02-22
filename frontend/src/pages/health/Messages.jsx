import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { sendMessage, listMessages, listConversations, listDoctors } from '../../api/health'

export default function Messages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [doctors, setDoctors] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newMsg, setNewMsg] = useState({ receiver_id: '', content: '' })
  const [showNewMsg, setShowNewMsg] = useState(false)

  const isDoctor = ['lekar', 'medicinska_sestra', 'administrator'].includes(user?.role)

  const loadConversations = async () => {
    try {
      const res = await listConversations()
      setConversations(res.data || [])
    } catch { setError('Greška pri učitavanju konverzacija.') }
    finally { setLoading(false) }
  }

  const loadMessages = async (withId) => {
    try {
      const res = await listMessages({ with: withId })
      setMessages(res.data || [])
    } catch { setError('Greška pri učitavanju poruka.') }
  }

  useEffect(() => {
    loadConversations()
    if (!isDoctor) {
      listDoctors().then((res) => setDoctors(res.data || []))
    }
  }, [])

  const handleSelectConv = (conv) => {
    const otherId = conv.sender_id === user?.id ? conv.receiver_id : conv.sender_id
    setSelectedConv({ ...conv, otherId })
    loadMessages(otherId)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    try {
      await sendMessage(newMsg)
      setShowNewMsg(false)
      setNewMsg({ receiver_id: '', content: '' })
      loadConversations()
      if (selectedConv?.otherId === newMsg.receiver_id) {
        loadMessages(newMsg.receiver_id)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Greška.')
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Poruke</h1>
          <p className="page-subtitle">Komunikacija sa medicinskim osobljem</p>
        </div>
        {!isDoctor && (
          <button className="btn btn-primary" onClick={() => setShowNewMsg(!showNewMsg)}>
            {showNewMsg ? 'Zatvori' : '+ Nova poruka'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showNewMsg && (
        <div className="card">
          <div className="card-title">Nova poruka</div>
          <form onSubmit={handleSend}>
            <div className="form-group">
              <label>Primalac</label>
              <select value={newMsg.receiver_id} onChange={(e) => setNewMsg({ ...newMsg, receiver_id: e.target.value })} required>
                <option value="">Izaberite doktora</option>
                {doctors.map((d) => <option key={d.user_id} value={d.user_id}>Dr. {d.first_name} {d.last_name} — {d.specialty}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Poruka</label>
              <textarea value={newMsg.content} onChange={(e) => setNewMsg({ ...newMsg, content: e.target.value })} rows={4} required />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary">Pošalji</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowNewMsg(false)}>Odustani</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--primary)' }}>
            Konverzacije
          </div>
          {loading ? <div className="spinner" /> : conversations.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--text-light)', fontSize: '0.9rem', textAlign: 'center' }}>Nema poruka.</div>
          ) : (
            conversations.map((conv, i) => {
              const otherId = conv.sender_id === user?.id ? conv.receiver_id : conv.sender_id
              const isSelected = selectedConv?.otherId === otherId
              return (
                <div
                  key={i}
                  onClick={() => handleSelectConv(conv)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    background: isSelected ? '#f0f4fb' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Konverzacija</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.content}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="card">
          {!selectedConv ? (
            <div className="empty-state">
              <div className="empty-state-icon">✉️</div>
              <p>Izaberite konverzaciju sa liste.</p>
            </div>
          ) : (
            <>
              <div className="card-title">Poruke</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, maxHeight: 400, overflowY: 'auto' }}>
                {messages.map((m) => {
                  const mine = m.sender_id === user?.id
                  return (
                    <div key={m.id} style={{
                      alignSelf: mine ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                      background: mine ? 'var(--primary)' : '#f0f4fb',
                      color: mine ? '#fff' : 'var(--text)',
                      padding: '10px 14px',
                      borderRadius: mine ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    }}>
                      <div style={{ fontSize: '0.9rem' }}>{m.content}</div>
                      <div style={{ fontSize: '0.75rem', marginTop: 4, opacity: 0.7 }}>
                        {m.created_at ? new Date(m.created_at).toLocaleString('sr-RS') : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
              <form onSubmit={(e) => {
                e.preventDefault()
                sendMessage({ receiver_id: selectedConv.otherId, content: e.target.msg.value })
                  .then(() => { e.target.reset(); loadMessages(selectedConv.otherId) })
                  .catch(() => setError('Greška pri slanju.'))
              }} style={{ display: 'flex', gap: 10 }}>
                <input name="msg" placeholder="Napišite poruku..." style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.95rem' }} required />
                <button className="btn btn-primary">Pošalji</button>
              </form>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
