
import java.util.Locale;

public class MissionPlanner {

    public static void main(String[] args) {

        RoutePlanner.setupMap();

        String[] sites = {"A", "B", "C"};

        double[] importance = {9, 6, 8};
        double[] accessibility = {4, 9, 8};
        double[] timeSuitability = {5, 8, 9};

        double explorationTime = 20;
        double safetyBuffer = 15;
        double availableTime = 180;

        double[] scores = new double[sites.length];
        double[] requiredTimes = new double[sites.length];

        String recommendedSite = "";
        double bestScore = -1;

        System.out.println("=== MarsWalk Mission Planner ===");

        for (int i = 0; i < sites.length; i++) {

            System.out.println("\nEvaluating Site " + sites[i]);

            double outboundTime =
                RoutePlanner.findBestRoute("Base", sites[i]);

            double returnTime =
                RoutePlanner.findBestRoute(sites[i], "Base");

            if (outboundTime < 0 || returnTime < 0) {
                requiredTimes[i] = Double.POSITIVE_INFINITY;
                System.out.println("Status: ROUTE UNAVAILABLE");
                continue;
            }

            double requiredTime = outboundTime
                                + returnTime
                                + explorationTime
                                + safetyBuffer;

            double score = ScientificEvaluator.calculateScore(
                importance[i],
                accessibility[i],
                timeSuitability[i]
            );

            requiredTimes[i] = requiredTime;
            scores[i] = score;

            System.out.printf(Locale.US,
                "Scientific Score: %.1f%n", score);

            System.out.printf(Locale.US,
                "Required Time: %.1f minutes%n", requiredTime);

            if (requiredTime <= availableTime) {

                System.out.println("Status: TIME FEASIBLE");

                if (score > bestScore) {
                    bestScore = score;
                    recommendedSite = sites[i];
                }

            } else {
                System.out.println("Status: NOT ENOUGH TIME");
            }
        }

        System.out.println("\n=== FINAL RECOMMENDATION ===");

        if (recommendedSite.isEmpty()) {
            System.out.println("No feasible mission found.");
        } else {
            System.out.println("Recommended Site: " + recommendedSite);

            System.out.printf(Locale.US,
                "Scientific Score: %.1f%n", bestScore);
        }

        System.out.println("\n=== AI DECISION EXPLANATION ===");

        if (recommendedSite.isEmpty()) {
            System.out.println(
                "No site meets the mission time constraints.");
        } else {

            for (int i = 0; i < sites.length; i++) {

                if (Double.isInfinite(requiredTimes[i])) {
                    System.out.println(
                        "Site " + sites[i]
                        + " was not selected because no route is available.");
                    continue;
                }

                String explanation =
                    DecisionExplanation.explainDecision(
                        sites[i],
                        scores[i],
                        requiredTimes[i],
                        availableTime,
                        recommendedSite,
                        bestScore
                    );

                System.out.println(explanation);
            }
        }
    }
}
