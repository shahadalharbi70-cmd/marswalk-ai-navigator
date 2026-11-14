
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

public class MarsWalkAPI {

    public static void main(String[] args) throws IOException {

        HttpServer server = HttpServer.create(
            new InetSocketAddress("localhost", 8080), 0
        );

        // API status endpoint
        server.createContext("/api/status", exchange -> {

            String response =
                "{\"project\":\"MarsWalk AI Navigator\","
                + "\"status\":\"running\"}";

            sendJson(exchange, response);
        });

        // Mission recommendation endpoint
        server.createContext("/api/mission", exchange -> {

            String response = MissionService.getMissionResult();

            sendJson(exchange, response);
        });

        server.start();

        System.out.println("=== MarsWalk API ===");
        System.out.println("Server is running!");
        System.out.println("Status: http://localhost:8080/api/status");
        System.out.println("Mission: http://localhost:8080/api/mission");
    }

    static void sendJson(HttpExchange exchange, String response)
            throws IOException {

        byte[] data = response.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set(
            "Content-Type", "application/json; charset=UTF-8"
        );

        exchange.sendResponseHeaders(200, data.length);

        try (OutputStream output = exchange.getResponseBody()) {
            output.write(data);
        }
    }
}
