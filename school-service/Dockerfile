# ---- Build stage ----
FROM --platform=linux/amd64 golang:1.23-alpine AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download
COPY *.go ./

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /school-service

# ---- Run stage ----
FROM --platform=linux/amd64 debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates tzdata wget && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /school-service /school-service
RUN chmod +x /school-service

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["/school-service"]
