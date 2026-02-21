package main

import (
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Maker struct {
	Secret []byte
	TTL    time.Duration
}

func (m Maker) Make(userID, email, role, firstName, lastName string) (string, error) {
	now := time.Now().UTC()
	claims := jwt.MapClaims{
		"iss":        "euprava25-sso",
		"sub":        userID,
		"email":      email,
		"role":       role,
		"first_name": firstName,
		"last_name":  lastName,
		"iat":        now.Unix(),
		"exp":        now.Add(m.TTL).Unix(),
		"jti":        jti(email, now),
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(m.Secret)
}

func jti(email string, t time.Time) string {
	h := sha256.Sum256([]byte(email + "|" + t.Format(time.RFC3339Nano)))
	return hex.EncodeToString(h[:])
}
