
import java.util.*;

public class RoutePlanner {

    // Represents a road between two locations
    static class Edge {
        String destination;
        double distance;
        double slope;
        double hazard;

        Edge(String destination, double distance,
             double slope, double hazard) {
            this.destination = destination;
            this.distance = distance;
            this.slope = slope;
            this.hazard = hazard;
        }
    }

    // Represents a location and its route cost
    static class Node {
        String name;
        double cost;

        Node(String name, double cost) {
            this.name = name;
            this.cost = cost;
        }
    }

    static Map<String, List<Edge>> marsMap = new HashMap<>();

    // Add a road in both directions
    static void addRoad(String from, String to,
                        double distance, double slope, double hazard) {

        marsMap.putIfAbsent(from, new ArrayList<>());
        marsMap.putIfAbsent(to, new ArrayList<>());

        marsMap.get(from).add(
            new Edge(to, distance, slope, hazard)
        );

        marsMap.get(to).add(
            new Edge(from, distance, slope, hazard)
        );
    }

    // Prepare the experimental Mars map
    static void setupMap() {

        marsMap.clear();

        addRoad("Base", "A", 2, 2, 1);
        addRoad("Base", "B", 1.5, 8, 7);
        addRoad("A", "C", 2, 3, 2);
        addRoad("B", "C", 1, 9, 8);
        addRoad("C", "D", 2, 2, 1);
    }

    // Calculate route cost
    static double calculateRouteCost(Edge edge) {

        return edge.distance *
               (1 + 0.04 * edge.slope + 0.12 * edge.hazard);
    }

    // Dijkstra algorithm
    static double findBestRoute(String start, String destination) {

        if (!marsMap.containsKey(start) ||
            !marsMap.containsKey(destination)) {
            System.out.println("No route found.");
            return -1;
        }

        PriorityQueue<Node> queue =
            new PriorityQueue<>(
                Comparator.comparingDouble(n -> n.cost)
            );

        Map<String, Double> distances = new HashMap<>();
        Map<String, String> previous = new HashMap<>();

        for (String location : marsMap.keySet()) {
            distances.put(location, Double.POSITIVE_INFINITY);
        }

        distances.put(start, 0.0);
        queue.add(new Node(start, 0.0));

        while (!queue.isEmpty()) {

            Node current = queue.poll();

            if (current.cost > distances.get(current.name)) {
                continue;
            }

            if (current.name.equals(destination)) {
                break;
            }

            for (Edge edge : marsMap.get(current.name)) {

                double newCost =
                    current.cost + calculateRouteCost(edge);

                if (newCost < distances.get(edge.destination)) {

                    distances.put(edge.destination, newCost);

                    previous.put(edge.destination, current.name);

                    queue.add(
                        new Node(edge.destination, newCost)
                    );
                }
            }
        }

        if (distances.get(destination) == Double.POSITIVE_INFINITY) {
            System.out.println("No route found.");
            return -1;
        }

        // Reconstruct the best path
        List<String> path = new ArrayList<>();
        String location = destination;

        while (location != null) {
            path.add(location);
            location = previous.get(location);
        }

        Collections.reverse(path);

        // Calculate total distance
        double totalDistance = 0;

        for (int i = 0; i < path.size() - 1; i++) {

            String current = path.get(i);
            String next = path.get(i + 1);

            for (Edge edge : marsMap.get(current)) {

                if (edge.destination.equals(next)) {
                    totalDistance += edge.distance;
                    break;
                }
            }
        }

        // Estimate travel time
        double walkingSpeed = 3.0; // km/h, demo only
        double travelTime = (totalDistance / walkingSpeed) * 60;

        System.out.println("Recommended Route: " +
                           String.join(" -> ", path));

        System.out.println("Total Distance: " +
                           totalDistance + " km");

        System.out.println("Estimated Travel Time: " +
                           travelTime + " minutes");

        System.out.printf(Locale.US,
                          "Total Route Cost: %.2f%n",
                          distances.get(destination));

        return travelTime;
    }

    public static void main(String[] args) {

        setupMap();

        findBestRoute("Base", "D");
    }
}
