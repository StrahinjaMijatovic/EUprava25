package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// 1. Elektronska prijava i evidencija učenika

type CreateEnrollmentRequest struct {
	FirstName   string `json:"first_name" binding:"required"`
	LastName    string `json:"last_name" binding:"required"`
	DateOfBirth string `json:"date_of_birth" binding:"required"`
	SchoolYear  string `json:"school_year" binding:"required"`
	Notes       string `json:"notes"`
}

func createEnrollment(c *gin.Context) {
	var req CreateEnrollmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	dob, err := time.Parse("2006-01-02", req.DateOfBirth)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date_of_birth, use YYYY-MM-DD"})
		return
	}
	enrollment := Enrollment{
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		DateOfBirth:  dob,
		ParentUserID: getUserID(c),
		SchoolYear:   req.SchoolYear,
		Status:       "pending",
		Notes:        req.Notes,
	}
	if result := db.Create(&enrollment); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, enrollment)
}

func listEnrollments(c *gin.Context) {
	role := getRole(c)
	userID := getUserID(c)
	var enrollments []Enrollment
	query := db
	if role == "roditelj" || role == "ucenik" {
		query = query.Where("parent_user_id = ?", userID)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	query.Order("created_at desc").Scopes(paginate(c)).Find(&enrollments)
	c.JSON(http.StatusOK, enrollments)
}

func getEnrollment(c *gin.Context) {
	id := c.Param("id")
	var enrollment Enrollment
	if result := db.First(&enrollment, "id = ?", id); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "enrollment not found"})
		return
	}
	c.JSON(http.StatusOK, enrollment)
}

type UpdateEnrollmentStatusRequest struct {
	Status             string `json:"status" binding:"required"`
	Notes              string `json:"notes"`
	HealthCertVerified bool   `json:"health_cert_verified"`
	HealthCertID       string `json:"health_cert_id"`
}

func updateEnrollmentStatus(c *gin.Context) {
	role := getRole(c)
	if role != "admin" && role != "administracija" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only admins can update enrollment status"})
		return
	}
	id := c.Param("id")
	var req UpdateEnrollmentStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var enrollment Enrollment
	if result := db.First(&enrollment, "id = ?", id); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "enrollment not found"})
		return
	}
	updates := map[string]interface{}{"status": req.Status}
	if req.Notes != "" {
		updates["notes"] = req.Notes
	}
	if req.HealthCertVerified {
		updates["health_cert_verified"] = true
		updates["health_cert_id"] = req.HealthCertID
	}
	if result := db.Model(&enrollment).Updates(updates); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	db.First(&enrollment, "id = ?", id)
	c.JSON(http.StatusOK, enrollment)
}