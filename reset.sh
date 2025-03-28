#!/usr/bin/bash

docker compose down -v
docker volume purne -f
docker compose up --build