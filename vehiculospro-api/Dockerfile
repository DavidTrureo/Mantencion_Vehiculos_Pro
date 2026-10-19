# =========================================================================
# Etapa 1: Compilación del proyecto con Maven y OpenJDK 17 (Alpine)
# =========================================================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# Optimización de caché Docker: copiar primero pom.xml y descargar dependencias
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar el código fuente y empaquetar el JAR ejecutable
COPY src ./src
RUN mvn clean package -DskipTests -B

# =========================================================================
# Etapa 2: Imagen de ejecución ultraligera con JRE 17 Alpine
# =========================================================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Crear usuario y grupo de sistema sin privilegios (Seguridad Non-Root)
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copiar el JAR generado desde la etapa de compilación con permisos adecuados
COPY --from=builder --chown=spring:spring /app/target/*.jar app.jar

# Variables de entorno y puerto por defecto (Cloud Run inyecta PORT dinámicamente)
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080

# Optimización de JVM para contenedores en la nube (Cloud Run / Docker)
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Dserver.port=${PORT}", \
    "-jar", "app.jar"]
