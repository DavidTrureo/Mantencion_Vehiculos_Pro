# ==========================================
# 1. Etapa de compilación (Maven + OpenJDK 17)
# ==========================================
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app

# Cachear dependencias copiando primero el pom.xml
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar el código fuente y compilar el JAR ejecutable
COPY src ./src
RUN mvn clean package -DskipTests

# ==========================================
# 2. Etapa de ejecución (JRE 17 ligera)
# ==========================================
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copiar el JAR generado desde la etapa de compilación
COPY --from=builder /app/target/*.jar app.jar

# Render expone automáticamente el puerto mediante la variable de entorno PORT
ENV PORT=8080
EXPOSE ${PORT}

# Optimización para plan gratuito (512MB RAM)
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
