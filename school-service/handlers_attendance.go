package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// 3. Elektronski dnevnik - prisustvo

type CreateAttendanceRequest struct {
	StudentID string `json:"student_id" binding:"required"`
	Date      string `json:"date" binding:"required"`
	Period    int    `json:"period" binding:"required"`
	Status    string `json:"status" binding:"required"`
}

func createAttendance(c *gin.Context) {
	role := getRole(c)
	if role != "nastavnik" && role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only teachers can record attendance"})
		return
	}
	var req CreateAttendanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}
	att := Attendance{
		StudentID: req.StudentID,
		Date:      date,
		Period:    req.Period,
		Status:    req.Status,
		TeacherID: getUserID(c),
	}
	if result := db.Create(&att); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, att)
}

func listAttendance(c *gin.Context) {
	role := getRole(c)
	userID := getUserID(c)
	var records []Attendance
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
	if dateFrom := c.Query("date_from"); dateFrom != "" {
		if d, err := time.Parse("2006-01-02", dateFrom); err == nil {
			query = query.Where("date >= ?", d)
		}
	}
	if dateTo := c.Query("date_to"); dateTo != "" {
		if d, err := time.Parse("2006-01-02", dateTo); err == nil {
			query = query.Where("date <= ?", d)
		}
	}
	query.Order("date desc, period asc").Scopes(paginate(c)).Find(&records)
	c.JSON(http.StatusOK, records)
}