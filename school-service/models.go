package main

import "time"

// Enrollment - prijava učenika za upis
type Enrollment struct {
	ID                 string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	FirstName          string    `gorm:"not null" json:"first_name"`
	LastName           string    `gorm:"not null" json:"last_name"`
	DateOfBirth        time.Time `json:"date_of_birth"`
	ParentUserID       string    `gorm:"type:varchar(36)" json:"parent_user_id"`
	SchoolYear         string    `gorm:"not null" json:"school_year"`
	Status             string    `gorm:"not null;default:'pending'" json:"status"`
	HealthCertVerified bool      `gorm:"default:false" json:"health_cert_verified"`
	HealthCertID       string    `json:"health_cert_id"`
	Notes              string    `json:"notes"`
	CreatedAt          time.Time `json:"created_at"`
}

// Student - upisani učenik
type Student struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID       string    `gorm:"type:varchar(36);uniqueIndex" json:"user_id"`
	FirstName    string    `gorm:"not null" json:"first_name"`
	LastName     string    `gorm:"not null" json:"last_name"`
	DateOfBirth  time.Time `json:"date_of_birth"`
	ParentUserID string    `gorm:"type:varchar(36)" json:"parent_user_id"`
	ClassID      string    `gorm:"type:uuid" json:"class_id"`
	CreatedAt    time.Time `json:"created_at"`
}

// Class - školsko odeljenje
type Class struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Year      int       `gorm:"not null" json:"year"`
	TeacherID string    `gorm:"type:varchar(36)" json:"teacher_id"`
	CreatedAt time.Time `json:"created_at"`
}

// Subject - predmet
type Subject struct {
	ID        string `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name      string `gorm:"not null" json:"name"`
	ClassID   string `gorm:"type:uuid" json:"class_id"`
	TeacherID string `gorm:"type:varchar(36)" json:"teacher_id"`
}

// Grade - ocena učenika
type Grade struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	StudentID string    `gorm:"type:uuid;not null;index" json:"student_id"`
	SubjectID string    `gorm:"type:uuid;not null" json:"subject_id"`
	Value     int       `gorm:"not null" json:"value"`
	GradeDate time.Time `gorm:"not null" json:"grade_date"`
	TeacherID string    `gorm:"type:varchar(36);not null" json:"teacher_id"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
}

// Attendance - evidencija prisustva
type Attendance struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	StudentID string    `gorm:"type:uuid;not null;index" json:"student_id"`
	Date      time.Time `gorm:"not null" json:"date"`
	Period    int       `gorm:"not null" json:"period"`
	Status    string    `gorm:"not null;default:'present'" json:"status"`
	TeacherID string    `gorm:"type:varchar(36);not null" json:"teacher_id"`
}

// SchoolAppointment - zakazivanje termina
type SchoolAppointment struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	RequesterID string    `gorm:"type:varchar(36);not null" json:"requester_id"`
	StaffID     string    `gorm:"type:varchar(36);not null" json:"staff_id"`
	DateTime    time.Time `gorm:"not null" json:"date_time"`
	Type        string    `gorm:"not null" json:"type"`
	Status      string    `gorm:"not null;default:'pending'" json:"status"`
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"created_at"`
}

// AbsenceJustification - opravdavanje izostanaka
type AbsenceJustification struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	StudentID   string    `gorm:"type:uuid;not null;index" json:"student_id"`
	StartDate   time.Time `gorm:"not null" json:"start_date"`
	EndDate     time.Time `gorm:"not null" json:"end_date"`
	Reason      string    `gorm:"not null" json:"reason"`
	DocumentURL string    `json:"document_url"`
	Status      string    `gorm:"not null;default:'pending'" json:"status"`
	ReviewedBy  string    `gorm:"type:varchar(36)" json:"reviewed_by"`
	CreatedAt   time.Time `json:"created_at"`
}

// SchoolDocument - školska dokumenta (potvrde, svedočanstva)
type SchoolDocument struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	StudentID string    `gorm:"type:uuid;not null;index" json:"student_id"`
	Type      string    `gorm:"not null" json:"type"`
	Content   string    `gorm:"type:text" json:"content"`
	IssuedBy  string    `gorm:"type:varchar(36)" json:"issued_by"`
	CreatedAt time.Time `json:"created_at"`
}