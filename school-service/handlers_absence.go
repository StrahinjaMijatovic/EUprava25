package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// 5. Digitalno opravdavanje izostanaka

type CreateAbsenceRequest struct {
	StudentID   string `json:"student_id"`
	StartDate   string `json:"start_date"`
	EndDate     string `json:"end_date"`
	// frontend aliases
	FromDate    string `json:"from_date"`
	ToDate      string `json:"to_date"`
	Reason      string `json:"reason" binding:"required"`
	DocumentURL string `json:"document_url"`
}

func createAbsenceJustification(c *gin.Context) {
	var req CreateAbsenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// support both start_date and from_date
	if req.StartDate == "" {
		req.StartDate = req.FromDate
	}
	if req.EndDate == "" {
		req.EndDate = req.ToDate
	}
	if req.StartDate == "" || req.EndDate == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start_date and end_date are required"})
		return
	}
	start, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_date"})
		return
	}
	end, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_date"})
		return
	}
	// auto-resolve student_id from JWT if not provided
	studentID := req.StudentID
	if studentID == "" {
		role := getRole(c)
		userID := getUserID(c)
		if role == "ucenik" || role == "roditelj" {
			var student Student
			query := db
			if role == "ucenik" {
				query = query.Where("user_id = ?", userID)
			} else {
				query = query.Where("parent_user_id = ?", userID)
			}
			if result := query.First(&student); result.Error == nil {
				studentID = student.ID
			}
		}
	}
	if studentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "student_id is required"})
		return
	}
	absence := AbsenceJustification{
		StudentID:   studentID,
		StartDate:   start,
		EndDate:     end,
		Reason:      req.Reason,
		DocumentURL: req.DocumentURL,
		Status:      "pending",
	}
	if result := db.Create(&absence); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, absence)
}

func listAbsenceJustifications(c *gin.Context) {
	role := getRole(c)
	userID := getUserID(c)
	var absences []AbsenceJustification
	query := db
	studentID := c.Query("student_id")
	if role == "ucenik" {
		var student Student
		if result := db.Where("user_id = ?", userID).First(&student); result.Error == nil {
			query = query.Where("student_id = ?", student.ID)
		}
	} else if role == "roditelj" {
		if studentID != "" {
			query = query.Where("student_id = ?", studentID)
		} else {
			var student Student
			if result := db.Where("parent_user_id = ?", userID).First(&student); result.Error == nil {
				query = query.Where("student_id = ?", student.ID)
			}
		}
	} else if studentID != "" {
		query = query.Where("student_id = ?", studentID)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	query.Order("created_at desc").Scopes(paginate(c)).Find(&absences)
	c.JSON(http.StatusOK, absences)
}

type UpdateAbsenceStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

func updateAbsenceStatus(c *gin.Context) {
	role := getRole(c)
	if role != "nastavnik" && role != "admin" && role != "administracija" {
		c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
		return
	}
	id := c.Param("id")
	var req UpdateAbsenceStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var absence AbsenceJustification
	if result := db.First(&absence, "id = ?", id); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "absence not found"})
		return
	}
	if result := db.Model(&absence).Updates(map[string]interface{}{
		"status":      req.Status,
		"reviewed_by": getUserID(c),
	}); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	db.First(&absence, "id = ?", id)
	c.JSON(http.StatusOK, absence)
}