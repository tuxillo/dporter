.PHONY: run build build-frontend test lint

run: build-frontend
	cd backend && go run .

build: build-frontend
	cd backend && go build -o ../dporter

build-frontend:
	npx tsc

lint:
	cd backend && go vet ./...

test:
	cd backend && go test ./...
