# Build stage
FROM golang:1.25-alpine AS builder

RUN apk add --no-cache git make

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o bin/api ./cmd/api

# Development stage with Air hot reload
FROM golang:1.25-alpine AS dev

RUN apk add --no-cache git make curl
RUN go install github.com/air-verse/air@latest

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
CMD ["air", "-c", ".air.toml"]

# Production stage — distroless, runs as the non-root user (uid 65532)
FROM gcr.io/distroless/static-debian12:nonroot AS production

WORKDIR /app
COPY --from=builder /app/bin/api /app/api
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/app/api"]
