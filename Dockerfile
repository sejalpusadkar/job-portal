# Root Dockerfile for Railway (monorepo-friendly)
# Railway builds from repo root; this Dockerfile builds and runs ONLY the Spring Boot backend in /backend.

# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /repo
COPY backend ./backend
RUN mvn -f backend/pom.xml clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=build /repo/backend/target/*.jar app.jar

# Safety net for Railway misconfiguration:
# If Railway's Service Settings incorrectly set the start command to `mvn ...`,
# the container would fail because `mvn` isn't installed in the runtime image.
# We add a tiny `mvn` shim that simply starts the Spring Boot app.
RUN printf '#!/bin/sh\nexec java -jar /app/app.jar\n' > /usr/local/bin/mvn && chmod +x /usr/local/bin/mvn

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
