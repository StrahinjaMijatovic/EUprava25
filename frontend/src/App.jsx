import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

// School
import Enrollments from './pages/school/Enrollments'
import Grades from './pages/school/Grades'
import Appointments from './pages/school/Appointments'
import Absences from './pages/school/Absences'
import Documents from './pages/school/Documents'

// Health
import HealthAppointments from './pages/health/HealthAppointments'
import Prescriptions from './pages/health/Prescriptions'
import Messages from './pages/health/Messages'
import HealthRecords from './pages/health/HealthRecords'
import HealthCard from './pages/health/HealthCard'
import MedicalCertificates from './pages/health/MedicalCertificates'

const SCHOOL_ROLES = ['ucenik', 'roditelj', 'nastavnik', 'administracija', 'admin']
const HEALTH_ROLES = ['pacijent', 'lekar', 'medicinska_sestra', 'administrator', 'admin']
const ALL_ROLES = [...new Set([...SCHOOL_ROLES, ...HEALTH_ROLES])]

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard */}
          <Route path="/" element={
            <PrivateRoute roles={ALL_ROLES}>
              <Dashboard />
            </PrivateRoute>
          } />

          {/* School routes */}
          <Route path="/school/enrollments" element={
            <PrivateRoute roles={SCHOOL_ROLES}><Enrollments /></PrivateRoute>
          } />
          <Route path="/school/grades" element={
            <PrivateRoute roles={SCHOOL_ROLES}><Grades /></PrivateRoute>
          } />
          <Route path="/school/appointments" element={
            <PrivateRoute roles={SCHOOL_ROLES}><Appointments /></PrivateRoute>
          } />
          <Route path="/school/absences" element={
            <PrivateRoute roles={SCHOOL_ROLES}><Absences /></PrivateRoute>
          } />
          <Route path="/school/documents" element={
            <PrivateRoute roles={SCHOOL_ROLES}><Documents /></PrivateRoute>
          } />

          {/* Health routes */}
          <Route path="/health/appointments" element={
            <PrivateRoute roles={HEALTH_ROLES}><HealthAppointments /></PrivateRoute>
          } />
          <Route path="/health/prescriptions" element={
            <PrivateRoute roles={HEALTH_ROLES}><Prescriptions /></PrivateRoute>
          } />
          <Route path="/health/messages" element={
            <PrivateRoute roles={HEALTH_ROLES}><Messages /></PrivateRoute>
          } />
          <Route path="/health/records" element={
            <PrivateRoute roles={HEALTH_ROLES}><HealthRecords /></PrivateRoute>
          } />
          <Route path="/health/healthcard" element={
            <PrivateRoute roles={HEALTH_ROLES}><HealthCard /></PrivateRoute>
          } />
          <Route path="/health/medical-certificates" element={
            <PrivateRoute roles={ALL_ROLES}><MedicalCertificates /></PrivateRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
