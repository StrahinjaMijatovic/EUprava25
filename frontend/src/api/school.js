import api from './axios'

// Enrollments
export const createEnrollment = (data) => api.post('/school/enrollments', data)
export const listEnrollments = () => api.get('/school/enrollments')
export const getEnrollment = (id) => api.get(`/school/enrollments/${id}`)
export const updateEnrollmentStatus = (id, data) => api.patch(`/school/enrollments/${id}/status`, data)

// Documents
export const createDocument = (data) => api.post('/school/documents', data)
export const listDocuments = () => api.get('/school/documents')
export const getDocument = (id) => api.get(`/school/documents/${id}`)

// Grades
export const createGrade = (data) => api.post('/school/grades', data)
export const listGrades = (params) => api.get('/school/grades', { params })
export const deleteGrade = (id) => api.delete(`/school/grades/${id}`)

// Attendance
export const createAttendance = (data) => api.post('/school/attendance', data)
export const listAttendance = (params) => api.get('/school/attendance', { params })

// School Appointments
export const createSchoolAppointment = (data) => api.post('/school/appointments', data)
export const listSchoolAppointments = () => api.get('/school/appointments')
export const updateSchoolAppointmentStatus = (id, data) => api.patch(`/school/appointments/${id}/status`, data)

// Absence Justifications
export const createAbsence = (data) => api.post('/school/absences', data)
export const listAbsences = () => api.get('/school/absences')
export const updateAbsenceStatus = (id, data) => api.patch(`/school/absences/${id}/status`, data)

// Students / Classes / Subjects
export const createStudent = (data) => api.post('/school/students', data)
export const listStudents = () => api.get('/school/students')
export const listClasses = () => api.get('/school/classes')
export const listSubjects = () => api.get('/school/subjects')
