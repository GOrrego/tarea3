from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StringType, TimestampType
from elasticsearch import Elasticsearch

# Crear sesión de Spark
spark = SparkSession.builder \
    .appName("Kafka-Spark-Elasticsearch") \
    .config("spark.master", "local[*]") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0") \
    .getOrCreate()

# Esquema del mensaje JSON
schema = StructType() \
    .add("alert_id", StringType()) \
    .add("timestamp", TimestampType()) \
    .add("message", StringType())

# Leer mensajes de Kafka
kafka_stream = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "kafka:9092") \
    .option("subscribe", "alerts") \
    .option("startingOffsets", "earliest") \
    .load()

# Parsear mensajes JSON
alerts = kafka_stream \
    .selectExpr("CAST(value AS STRING) as json") \
    .select(from_json(col("json"), schema).alias("data")) \
    .select("data.*")

# Función para enviar datos a Elasticsearch
def send_to_elasticsearch(batch_df, batch_id):
    es = Elasticsearch(['http://elasticsearch:9200'])
    records = batch_df.toJSON().collect()
    for record in records:
        es.index(index="alerts", document=record)

# Escribir datos en Elasticsearch
query = alerts.writeStream \
    .outputMode("append") \
    .foreachBatch(send_to_elasticsearch) \
    .start()

query.awaitTermination()
