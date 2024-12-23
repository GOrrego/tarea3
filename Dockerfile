# Usa una imagen base de Node.js
FROM node:16

# Instala dependencias necesarias para Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Instala el navegador Chrome
RUN apt-get update && apt-get install -y chromium

# Establece el directorio de trabajo
WORKDIR /usr/src/app

# Copia los archivos del proyecto
COPY package*.json ./
COPY . .

# Instala las dependencias del proyecto
RUN npm install

# Establece la variable de entorno necesaria para Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Exponer el puerto del contenedor (si es necesario)
EXPOSE 8080

# Comando por defecto
CMD ["node", "scrap.js"]
