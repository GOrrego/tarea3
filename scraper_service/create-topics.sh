#!/bin/bash

# Crear tópico 'alerts'
kafka-topics --create \
  --topic alerts \
  --bootstrap-server kafka:9092 \
  --partitions 1 \
  --replication-factor 1 || echo "El tópico ya existe."
