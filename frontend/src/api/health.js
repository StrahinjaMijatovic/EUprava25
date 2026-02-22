import api from './axios'

// Appointments
export const createHealthAppointment = (data) => api.post('/health/appointments', data)
export const listHealthAppointments = () => api.get('/health/appointments')
export const updateHealthAppointmentStatus = (id, data) => api.patch(`/health/appointments/${id}/status`, data)

// Prescriptions
export const createPrescription = (data) => api.post('/health/prescriptions', data)
export const listPrescriptions = () => api.get('/health/prescriptions')
export const updatePrescriptionStatus = (id, data) => api.patch(`/health/prescriptions/${id}/status`, data)

// Messages
export const sendMessage = (data) => api.post('/health/messages', data)
export const listMessages = (params) => api.get('/health/messages', { params })
export const listConversations = () => api.get('/health/conversations')

// Health Records
export const createHealthRecord = (data) => api.post('/health/health-records', data)
export const listHealthRecords = (params) => api.get('/health/health-records', { params })
export const createLabResult = (data) => api.post('/health/lab-results', data)
export const listLabResults = (params) => api.get('/health/lab-results', { params })

// Health Card
export const createHealthCardRequest = (data) => api.post('/health/health-card-requests', data)
export const listHealthCardRequests = () => api.get('/health/health-card-requests')
export const updateHealthCardRequestStatus = (id, data) => api.patch(`/health/health-card-requests/${id}/status`, data)

// Patients / Doctors
export const getMyPatient = () => api.get('/health/patients/me')
export const getMyDoctor = () => api.get('/health/doctors/me')
export const createDoctor = (data) => api.post('/health/doctors', data)
export const listPatients = () => api.get('/health/patients')
export const createPatient = (data) => api.post('/health/patients', data)
export const listDoctors = () => api.get('/health/doctors')

// Medical Certificates
export const createMedicalCertificate = (data) => api.post('/health/medical-certificates', data)
export const listMedicalCertificates = () => api.get('/health/medical-certificates')
export const getMedicalCertificate = (id) => api.get(`/health/medical-certificates/${id}`)
