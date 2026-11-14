
import java.util.Locale;

public class MissionService {

    public static String getMissionResult() {

        RoutePlanner.setupMap();

        String[] sites = {"A", "B", "C"};

        double[] importance = {9, 6, 8};
        double[] accessibility = {4, 9, 8};
        double[] timeSuitability = {5, 8, 9};

        double explorationTime = 20;
        double safetyBuffer = 15;
        double availableTime = 180;

        String recommendedSite = "";
        double bestScore = -1;
        double bestRequiredTime = 0;

        for (int i = 0; i < sites.length; i++) {

            double outboundTime =
                RoutePlanner.findBestRoute("Base", sites[i]);

            double returnTime =
                RoutePlanner.findBestRoute(sites[i], "Base");

            if (outboundTime < 0 || returnTime < 0) {
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

            if (requiredTime <= availableTime && score > bestScore) {
                bestScore = score;
                recommendedSite = sites[i];
                bestRequiredTime = requiredTime;
            }
        }

        if (recommendedSite.isEmpty()) {
            return "{\"status\":\"NO_FEASIBLE_MISSION\"}";
        }

        return String.format(Locale.US,
            "{"
            + "\"recommendedSite\":\"%s\","
            + "\"scientificScore\":%.1f,"
            + "\"requiredTime\":%.1f,"
            + "\"availableTime\":%.1f,"
            + "\"status\":\"TIME_FEASIBLE\""
            + "}",
            recommendedSite,
            bestScore,
            bestRequiredTime,
            availableTime
        );
    }
}
