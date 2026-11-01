#!/bin/bash
cd "$(dirname "$0")"
open -a Docker
until docker info >/dev/null 2>&1; do sleep 2; done
cp -n .env.example .env 2>/dev/null
docker compose up --build -d
open http://localhost:5173
