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

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

