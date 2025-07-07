.PHONY: run build test lint

run:
	cd backend && go run .

build:
	cd backend && go build -o ../dporter

lint:
	cd backend && go vet ./...

test:
	cd backend && go test ./...
