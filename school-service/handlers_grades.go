package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// 3. Elektronski dnevnik - ocene

type CreateGradeRequest struct {
	StudentID string `json:"student_id" binding:"required"`
	SubjectID string `json:"subject_id" binding:"required"`
	Value     int    `json:"value" binding:"required,min=1,max=5"`
	GradeDate string `json:"grade_date"`
	Comment   string `json:"comment"`
}

func createGrade(c *gin.Context) {
	role := getRole(c)
	if role != "nastavnik" && role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only teachers can add grades"})
		return
	}
	var req CreateGradeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	gradeDate := time.Now()
	if req.GradeDate != "" {
		if d, err := time.Parse("2006-01-02", req.GradeDate); err == nil {
			gradeDate = d
		}
	}
	grade := Grade{
		StudentID: req.StudentID,
		SubjectID: req.SubjectID,
		Value:     req.Value,
		GradeDate: gradeDate,
		TeacherID: getUserID(c),
		Comment:   req.Comment,
	}
	if result := db.Create(&grade); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, grade)
}

func listGrades(c *gin.Context) {
	role := getRole(c)
	userID := getUserID(c)
	var grades []Grade
	query := db
	studentID := c.Query("student_id")
	subjectID := c.Query("subject_id")
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
	if subjectID != "" {
		query = query.Where("subject_id = ?", subjectID)
	}
	query.Order("grade_date desc").Scopes(paginate(c)).Find(&grades)
	c.JSON(http.StatusOK, grades)
}

func deleteGrade(c *gin.Context) {
	role := getRole(c)
	if role != "nastavnik" && role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
		return
	}
	id := c.Param("id")
	if result := db.Delete(&Grade{}, "id = ?", id); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "grade deleted"})
}