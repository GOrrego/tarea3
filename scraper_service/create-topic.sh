#!/bin/bash

# Esperar a que Kafka esté disponible
echo "Esperando a que Kafka esté disponible..."
cub kafka-ready -b kafka:9092 1 20

# Crear el tópico 'alerts' si no existe
kafka-topics.sh --create --if-not-exists \
  --bootstrap-server kafka:9092 \
  --replication-factor 1 \
  --partitions 1 \
  --topic alerts

echo "Tópico 'alerts' creado (o ya existente)."
