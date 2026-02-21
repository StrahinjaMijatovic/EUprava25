package main

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPool(dsn string) *pgxpool.Pool {
	var pool *pgxpool.Pool
	var err error

	for i := 0; i < 10; i++ {
		pool, err = pgxpool.New(context.Background(), dsn)
		if err == nil {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			err = pool.Ping(ctx)
			cancel()
			if err == nil {
				break
			}
			pool.Close()
		}
		log.Printf("DB connection attempt %d failed: %v, retrying...", i+1, err)
		time.Sleep(3 * time.Second)
	}
	if err != nil {
		log.Fatal("db connection failed after retries:", err)
	}

	migrateSSO(pool)
	return pool
}

func migrateSSO(pool *pgxpool.Pool) {
	ctx := context.Background()
	_, _ = pool.Exec(ctx, "CREATE EXTENSION IF NOT EXISTS pgcrypto")

	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			email TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'USER',
			first_name TEXT NOT NULL DEFAULT '',
			last_name TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT now()
		)
	`)
	if err == nil {
		// add columns if they don't exist (upgrade from old schema)
		pool.Exec(ctx, `ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT ''`)
		pool.Exec(ctx, `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT ''`)
	}
	if err != nil {
		log.Fatalf("SSO migration failed: %v", err)
	}
	log.Println("SSO DB schema migrated")
}
