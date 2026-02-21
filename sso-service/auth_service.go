package main

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	DB       *pgxpool.Pool
	JWTMaker interface {
		Make(userID, email, role, firstName, lastName string) (string, error)
	}
}

var (
	ErrInvalidCreds = errors.New("invalid credentials")
)

func (s AuthService) Register(ctx context.Context, email, password, role, firstName, lastName string) (id string, createdAt string, err error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", "", err
	}

	var t time.Time
	q := `INSERT INTO users (email, password_hash, role, first_name, last_name)
	      VALUES ($1, $2, $3, $4, $5)
	      RETURNING id, created_at`
	if err = s.DB.QueryRow(ctx, q, email, string(hash), role, firstName, lastName).
		Scan(&id, &t); err != nil {
		return "", "", err
	}
	return id, t.Format(time.RFC3339), nil
}

func (s AuthService) Login(ctx context.Context, email, password string) (token string, err error) {
	var id, role, ph, firstName, lastName string
	q := `SELECT id, role, password_hash, first_name, last_name FROM users WHERE email = $1`
	if err = s.DB.QueryRow(ctx, q, email).Scan(&id, &role, &ph, &firstName, &lastName); err != nil {
		return "", ErrInvalidCreds
	}
	if bcrypt.CompareHashAndPassword([]byte(ph), []byte(password)) != nil {
		return "", ErrInvalidCreds
	}
	return s.JWTMaker.Make(id, email, role, firstName, lastName)
}
