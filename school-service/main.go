package main

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func main() {
	initDB()

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "supersecretkey"
	}

	r := setupRouter([]byte(jwtSecret))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("School service listening on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

func initDB() {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Europe/Belgrade",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_USER", "school_user"),
		getEnv("DB_PASSWORD", "school_pass"),
		getEnv("DB_NAME", "school_db"),
		getEnv("DB_PORT", "5432"),
	)

	var err error
	for i := 0; i < 10; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			break
		}
		log.Printf("DB connection attempt %d failed, retrying...", i+1)
		time.Sleep(3 * time.Second)
	}
	if err != nil {
		log.Fatalf("Failed to connect to School DB: %v", err)
	}

	log.Println("Connected to School DB")
	db.Exec("CREATE EXTENSION IF NOT EXISTS pgcrypto")

	if err = db.AutoMigrate(
		&Enrollment{},
		&Student{},
		&Class{},
		&Subject{},
		&Grade{},
		&Attendance{},
		&SchoolAppointment{},
		&AbsenceJustification{},
		&SchoolDocument{},
	); err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}
	log.Println("School DB schema migrated")
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func paginate(c *gin.Context) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		limit := 50
		offset := 0
		if l := c.Query("limit"); l != "" {
			if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 200 {
				limit = n
			}
		}
		if o := c.Query("offset"); o != "" {
			if n, err := strconv.Atoi(o); err == nil && n >= 0 {
				offset = n
			}
		}
		return db.Limit(limit).Offset(offset)
	}
}