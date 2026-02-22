package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// 1. Elektronsko zakazivanje pregleda

type CreateHealthAppointmentRequest struct {
	DoctorID string `json:"doctor_id" binding:"required"`
	DateTime string `json:"date_time" binding:"required"`
	Type     string `json:"type" binding:"required"`
	Notes    string `json:"notes"`
}

func createHealthAppointment(c *gin.Context) {
	var req CreateHealthAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	dt, err := time.Parse(time.RFC3339, req.DateTime)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date_time, use RFC3339 format"})
		return
	}
	var patient Patient
	if result := db.Where("user_id = ?", getUserID(c)).First(&patient); result.Error != nil {
		// auto-create patient profile from JWT claims
		claims, _ := c.Get("claims")
		firstName, lastName := "", ""
		if m, ok := claims.(map[string]interface{}); ok {
			if v, ok := m["first_name"].(string); ok {
				firstName = v
			}
			if v, ok := m["last_name"].(string); ok {
				lastName = v
			}
		}
		if firstName == "" {
			firstName = "Pacijent"
		}
		if lastName == "" {
			if email, ok := claims.(map[string]interface{})["email"].(string); ok {
				lastName = email
			}
		}
		patient = Patient{UserID: getUserID(c), FirstName: firstName, LastName: lastName}
		if err := db.Create(&patient).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create patient profile: " + err.Error()})
			return
		}
	}
	appt := HealthAppointment{
		PatientID: patient.ID,
		DoctorID:  req.DoctorID,
		DateTime:  dt,
		Type:      req.Type,
		Status:    "pending",
		Notes:     req.Notes,
	}
	if result := db.Create(&appt); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, appt)
}

func listHealthAppointments(c *gin.Context) {
	role := getRole(c)
	userID := getUserID(c)
	var appts []HealthAppointment
	query := db
	if role == "pacijent" {
		var patient Patient
		if result := db.Where("user_id = ?", userID).First(&patient); result.Error == nil {
			query = query.Where("patient_id = ?", patient.ID)
		} else {
			c.JSON(http.StatusOK, []HealthAppointment{})
			return
		}
	} else if role == "lekar" {
		var doctor Doctor
		if result := db.Where("user_id = ?", userID).First(&doctor); result.Error == nil {
			query = query.Where("doctor_id = ?", doctor.ID)
		}
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	query.Order("date_time asc").Scopes(paginate(c)).Find(&appts)
	c.JSON(http.StatusOK, appts)
}

type UpdateHealthAppointmentStatusRequest struct {
	Status string `json:"status" binding:"required"`
	Notes  string `json:"notes"`
}

func updateHealthAppointmentStatus(c *gin.Context) {
	role := getRole(c)
	if role != "lekar" && role != "admin" && role != "medicinska_sestra" {
		c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
		return
	}
	id := c.Param("id")
	var req UpdateHealthAppointmentStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var appt HealthAppointment
	if result := db.First(&appt, "id = ?", id); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "appointment not found"})
		return
	}
	updates := map[string]interface{}{"status": req.Status}
	if req.Notes != "" {
		updates["notes"] = req.Notes
	}
	if result := db.Model(&appt).Updates(updates); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	db.First(&appt, "id = ?", id)
	c.JSON(http.StatusOK, appt)
}