package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type CreateStudentRequest struct {
	UserID      string `json:"user_id" binding:"required"`
	FirstName   string `json:"first_name" binding:"required"`
	LastName    string `json:"last_name" binding:"required"`
	DateOfBirth string `json:"date_of_birth"`
	ParentUserID string `json:"parent_user_id"`
	ClassID     string `json:"class_id"`
}

func createStudent(c *gin.Context) {
	role := getRole(c)
	if role != "admin" && role != "administracija" {
		c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
		return
	}
	var req CreateStudentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var dob time.Time
	if req.DateOfBirth != "" {
		if d, err := time.Parse("2006-01-02", req.DateOfBirth); err == nil {
			dob = d
		}
	}
	student := Student{
		UserID:       req.UserID,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		DateOfBirth:  dob,
		ParentUserID: req.ParentUserID,
		ClassID:      req.ClassID,
	}
	if result := db.Create(&student); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, student)
}

func listStudents(c *gin.Context) {
	var students []Student
	query := db
	if classID := c.Query("class_id"); classID != "" {
		query = query.Where("class_id = ?", classID)
	}
	if userID := c.Query("user_id"); userID != "" {
		query = query.Where("user_id = ?", userID)
	}
	if parentID := c.Query("parent_user_id"); parentID != "" {
		query = query.Where("parent_user_id = ?", parentID)
	}
	query.Scopes(paginate(c)).Find(&students)
	c.JSON(http.StatusOK, students)
}

func getStudent(c *gin.Context) {
	id := c.Param("id")
	var student Student
	if result := db.First(&student, "id = ?", id); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		return
	}
	c.JSON(http.StatusOK, student)
}

type CreateClassRequest struct {
	Name      string `json:"name" binding:"required"`
	Year      int    `json:"year" binding:"required"`
	TeacherID string `json:"teacher_id"`
}

func createClass(c *gin.Context) {
	role := getRole(c)
	if role != "admin" && role != "administracija" {
		c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
		return
	}
	var req CreateClassRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	class := Class{
		Name:      req.Name,
		Year:      req.Year,
		TeacherID: req.TeacherID,
	}
	if result := db.Create(&class); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, class)
}

func listClasses(c *gin.Context) {
	var classes []Class
	db.Scopes(paginate(c)).Find(&classes)
	c.JSON(http.StatusOK, classes)
}

type CreateSubjectRequest struct {
	Name      string `json:"name" binding:"required"`
	ClassID   string `json:"class_id" binding:"required"`
	TeacherID string `json:"teacher_id"`
}

func createSubject(c *gin.Context) {
	role := getRole(c)
	if role != "admin" && role != "administracija" {
		c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
		return
	}
	var req CreateSubjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	subject := Subject{
		Name:      req.Name,
		ClassID:   req.ClassID,
		TeacherID: req.TeacherID,
	}
	if result := db.Create(&subject); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, subject)
}

func listSubjects(c *gin.Context) {
	var subjects []Subject
	query := db
	if classID := c.Query("class_id"); classID != "" {
		query = query.Where("class_id = ?", classID)
	}
	query.Scopes(paginate(c)).Find(&subjects)
	c.JSON(http.StatusOK, subjects)
}