# ---- Build Stage ----
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# ---- Run Stage ----
FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Force IPv4 to avoid some hosting environments preferring IPv6 and failing with "Network is unreachable"
ENTRYPOINT ["java","-Djava.net.preferIPv4Stack=true","-jar","app.jar"]
