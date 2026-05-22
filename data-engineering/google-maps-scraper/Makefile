APP_NAME := food_gmaps_scraper
VERSION := local

default: help

help: ## show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "%-24s %s\n", $$1, $$2}'

build: ## build the Go scraper binary
	go build -buildvcs=false -o bin/$(APP_NAME) .

docker: ## build the scraper Docker image
	docker build -t $(APP_NAME):$(VERSION) .

db-up: ## start local Postgres
	docker compose up -d postgres

db-down: ## stop local Postgres
	docker compose down

python-check: ## compile the single Python pipeline file
	python -m py_compile scripts/food_pipeline.py

test-go: ## run the retained Go package tests
	go test ./gmaps ./runner ./deduper ./grid ./exiter

clean: ## remove local build and output artifacts
	rm -rf bin gmaps-output
