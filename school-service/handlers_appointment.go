package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// 4. Zakazivanje termina

type CreateSchoolAppointmentRequest struct {
	StaffID  string `json:"staff_id"`
	DateTime string `json:"date_time" binding:"required"`
	Type     string `json:"type" binding:"required"`
	Notes    string `json:"notes"`
}

func createSchoolAppointment(c *gin.Context) {
	var req CreateSchoolAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	dt, err := time.Parse(time.RFC3339, req.DateTime)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date_time, use RFC3339 format"})
		return
	}
	appt := SchoolAppointment{
		RequesterID: getUserID(c),
		StaffID:     req.StaffID,
		DateTime:    dt,
		Type:        req.Type,
		Status:      "pending",
		Notes:       req.Notes,
	}
	if result := db.Create(&appt); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, appt)
}

func listSchoolAppointments(c *gin.Context) {
	role := getRole(c)
	userID := getUserID(c)
	var appts []SchoolAppointment
	query := db
	if role == "roditelj" || role == "ucenik" {
		query = query.Where("requester_id = ?", userID)
	} else if role == "nastavnik" {
		query = query.Where("staff_id = ?", userID)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	query.Order("date_time asc").Scopes(paginate(c)).Find(&appts)
	c.JSON(http.StatusOK, appts)
}

type UpdateSchoolAppointmentStatusRequest struct {
	Status string `json:"status" binding:"required"`
	Notes  string `json:"notes"`
}

func updateSchoolAppointmentStatus(c *gin.Context) {
	role := getRole(c)
	if role != "nastavnik" && role != "admin" && role != "administracija" {
		c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
		return
	}
	id := c.Param("id")
	var req UpdateSchoolAppointmentStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var appt SchoolAppointment
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