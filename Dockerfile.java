# ============================================================
# Dockerfile.java — Java Spring Boot Microservice
# Multi-stage: Maven Build → Minimal JRE Runtime
# Usage: docker build -f Dockerfile.java -t myapp:v1.0 .
# ============================================================

# ── Stage 1: Maven Build ─────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Cache Maven dependencies first
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build JAR
COPY src ./src
RUN mvn clean package -DskipTests -q

# ── Stage 2: Minimal JRE Runtime ─────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseContainerSupport" \
    SPRING_PROFILES_ACTIVE=production \
    SERVER_PORT=8080

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring

# Copy built JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Change ownership to non-root user
RUN chown spring:spring app.jar
USER spring

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
