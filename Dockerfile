
FROM eclipse-temurin:25-jdk

WORKDIR /app

COPY . .

RUN javac *.java

EXPOSE 8080

CMD ["java", "MarsWalkAPI"]
