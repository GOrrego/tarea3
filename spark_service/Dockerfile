# Imagen base de Debian que incluye herramientas necesarias
FROM debian:bullseye-slim

# Instalar dependencias necesarias
RUN apt-get update && \
    apt-get install -y \
    openjdk-11-jdk \
    curl \
    python3 \
    python3-pip && \
    apt-get clean

# Establecer variables de entorno para Java
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
ENV PATH=$JAVA_HOME/bin:$PATH

# Descargar e instalar Apache Spark
ENV SPARK_VERSION=3.5.0
RUN curl -s https://downloads.apache.org/spark/spark-${SPARK_VERSION}/spark-${SPARK_VERSION}-bin-hadoop3.tgz | tar -xz -C /opt/ && \
    mv /opt/spark-${SPARK_VERSION}-bin-hadoop3 /opt/spark
ENV SPARK_HOME=/opt/spark
ENV PATH=$SPARK_HOME/bin:$SPARK_HOME/sbin:$PATH

# Instalar dependencias de Python
COPY requirements.txt /app/requirements.txt
RUN pip3 install --no-cache-dir -r /app/requirements.txt

# Crear directorio de trabajo
WORKDIR /app

# Copiar el código fuente
COPY app.py /app/app.py

# Configurar punto de entrada para ejecutar el script
CMD ["python3", "app.py"]
