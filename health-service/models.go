package main

import "time"

// Patient - profil pacijenta
type Patient struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID       string    `gorm:"type:varchar(36);uniqueIndex;not null" json:"user_id"`
	FirstName    string    `gorm:"not null" json:"first_name"`
	LastName     string    `gorm:"not null" json:"last_name"`
	DateOfBirth  time.Time `json:"date_of_birth"`
	HealthCardNo string    `gorm:"uniqueIndex" json:"health_card_no"`
	DoctorID     *string   `gorm:"type:uuid" json:"doctor_id"`
	CreatedAt    time.Time `json:"created_at"`
}

// Doctor - profil lekara
type Doctor struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    string    `gorm:"type:varchar(36);uniqueIndex;not null" json:"user_id"`
	FirstName string    `gorm:"not null" json:"first_name"`
	LastName  string    `gorm:"not null" json:"last_name"`
	Specialty string    `json:"specialty"`
	CreatedAt time.Time `json:"created_at"`
}

// HealthAppointment - zakazivanje pregleda
type HealthAppointment struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PatientID string    `gorm:"type:uuid;not null;index" json:"patient_id"`
	DoctorID  string    `gorm:"type:uuid;not null" json:"doctor_id"`
	DateTime  time.Time `gorm:"not null" json:"date_time"`
	Type      string    `gorm:"not null" json:"type"`
	Status    string    `gorm:"not null;default:'pending'" json:"status"`
	Notes     string    `json:"notes"`
	CreatedAt time.Time `json:"created_at"`
}

// Prescription - elektronski recept
type Prescription struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PatientID  string    `gorm:"type:uuid;not null;index" json:"patient_id"`
	DoctorID   string    `gorm:"type:uuid;not null" json:"doctor_id"`
	Medication string    `gorm:"not null" json:"medication"`
	Dosage     string    `gorm:"not null" json:"dosage"`
	Duration   string    `json:"duration"`
	Status     string    `gorm:"not null;default:'active'" json:"status"`
	IssuedAt   time.Time `gorm:"not null" json:"issued_at"`
	CreatedAt  time.Time `json:"created_at"`
}

// Message - komunikacija lekar-pacijent
type Message struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	SenderID   string    `gorm:"type:varchar(36);not null;index" json:"sender_id"`
	ReceiverID string    `gorm:"type:varchar(36);not null;index" json:"receiver_id"`
	Content    string    `gorm:"type:text;not null" json:"content"`
	IsRead     bool      `gorm:"default:false" json:"is_read"`
	CreatedAt  time.Time `json:"created_at"`
}

// HealthRecord - eKarton
type HealthRecord struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PatientID  string    `gorm:"type:uuid;not null;index" json:"patient_id"`
	DoctorID   string    `gorm:"type:varchar(36);not null" json:"doctor_id"`
	Diagnosis  string    `gorm:"type:text;not null" json:"diagnosis"`
	Treatment  string    `gorm:"type:text" json:"treatment"`
	RecordDate time.Time `gorm:"not null" json:"record_date"`
	CreatedAt  time.Time `json:"created_at"`
}

// LabResult - laboratorijski nalazi
type LabResult struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PatientID  string    `gorm:"type:uuid;not null;index" json:"patient_id"`
	TestName   string    `gorm:"not null" json:"test_name"`
	Result     string    `gorm:"type:text;not null" json:"result"`
	ResultDate time.Time `gorm:"not null" json:"result_date"`
	DoctorID   string    `gorm:"type:varchar(36)" json:"doctor_id"`
	CreatedAt  time.Time `json:"created_at"`
}

// HealthCardRequest - zahtev za zdravstvenu knjižicu
type HealthCardRequest struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PatientID   string    `gorm:"type:uuid;not null;index" json:"patient_id"`
	RequestType string    `gorm:"not null" json:"request_type"`
	Status      string    `gorm:"not null;default:'pending'" json:"status"`
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"created_at"`
}

// MedicalCertificate - medicinska potvrda (integracija sa školom)
type MedicalCertificate struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PatientID   string    `gorm:"type:uuid;not null;index" json:"patient_id"`
	PatientName string    `gorm:"not null" json:"patient_name"`
	Type        string    `gorm:"not null" json:"type"`
	ValidFrom   time.Time `gorm:"not null" json:"valid_from"`
	ValidTo     time.Time `gorm:"not null" json:"valid_to"`
	DoctorID    string    `gorm:"type:varchar(36);not null" json:"doctor_id"`
	Notes       string    `json:"notes"`
	IssuedAt    time.Time `json:"issued_at"`
}