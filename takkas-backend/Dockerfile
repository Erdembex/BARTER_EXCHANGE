# ── Spring Boot Production Dockerfile ──
# Build: docker build -t takkas-backend .
# Run:   docker run --env-file .env -p 8080:8080 takkas-backend

FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN apk add --no-cache maven \
    && mvn -B package -DskipTests -q \
    && mv target/takkas-backend-*.jar app.jar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S takkas && adduser -S takkas -G takkas
COPY --from=builder /build/app.jar app.jar
RUN mkdir -p /var/takkas/uploads && chown -R takkas:takkas /var/takkas
USER takkas
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
