package main

import (
	"log"
	"os"
	"strconv"
	"time"
)

type Config struct {
	Port      string
	Database  string
	JWTSecret []byte
	JWTTTL    time.Duration
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func getMinutesEnv(key string, def int) time.Duration {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return time.Duration(n) * time.Minute
		}
	}
	return time.Duration(def) * time.Minute
}

func Load() *Config {
	cfg := &Config{
		Port:      getEnv("PORT", "8080"),
		Database:  getEnv("DATABASE_URL", "postgres://sso_user:sso_pass@postgres-sso:5432/sso?sslmode=disable"),
		JWTSecret: []byte(getEnv("JWT_SECRET", "dev_secret_change_me")),
		JWTTTL:    getMinutesEnv("JWT_TTL_MINUTES", 120),
	}
	log.Printf("[config] loaded (port=%s)", cfg.Port)
	return cfg
}
