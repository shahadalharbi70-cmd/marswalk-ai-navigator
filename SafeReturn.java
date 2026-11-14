
public class SafeReturn {

    public static void main(String[] args) {

        // Prepare the Mars map
        RoutePlanner.setupMap();

        // Calculate outbound and return travel times
        double outboundTime =
            RoutePlanner.findBestRoute("Base", "D");

        double returnTime =
            RoutePlanner.findBestRoute("D", "Base");

        // Mission settings (demo values)
        double explorationTime = 20;
        double safetyBuffer = 15;
        double availableTime = 300;

        System.out.println("\n=== MarsWalk Safe Return ===");

        // Check that both routes exist
        if (outboundTime < 0 || returnTime < 0) {
            System.out.println("Mission Status: NOT APPROVED");
            System.out.println("A required route is unavailable.");
            return;
        }

        // Calculate total mission time
        double totalTime = outboundTime
                         + explorationTime
                         + returnTime
                         + safetyBuffer;

        System.out.println("Outbound Time: "
                           + outboundTime + " minutes");

        System.out.println("Return Time: "
                           + returnTime + " minutes");

        System.out.println("Exploration Time: "
                           + explorationTime + " minutes");

        System.out.println("Safety Buffer: "
                           + safetyBuffer + " minutes");

        System.out.println("Required Time: "
                           + totalTime + " minutes");

        System.out.println("Available Time: "
                           + availableTime + " minutes");

        if (totalTime <= availableTime) {
            System.out.println("Mission Status: APPROVED");
        } else {
            System.out.println("Mission Status: NOT APPROVED");
        }
    }
}
