
import java.util.Locale;

public class DecisionExplanation {

    static String explainDecision(
            String site,
            double score,
            double requiredTime,
            double availableTime,
            String recommendedSite,
            double recommendedScore) {

        // Case 1: Site exceeds available mission time
        if (requiredTime > availableTime) {

            double extraTime = requiredTime - availableTime;

            return String.format(Locale.US,
                "Site %s was not selected because it exceeds "
                + "the available mission time by %.1f minutes.",
                site, extraTime);
        }

        // Case 2: Site is the recommended option
        if (site.equals(recommendedSite)) {

            return String.format(Locale.US,
                "Site %s was selected because it has the highest "
                + "scientific score (%.1f) among time-feasible sites.",
                site, score);
        }

        // Case 3: Feasible site with a lower scientific score
        return String.format(Locale.US,
            "Site %s is time-feasible, but its scientific score "
            + "(%.1f) is lower than Site %s (%.1f).",
            site, score, recommendedSite, recommendedScore);
    }

    public static void main(String[] args) {

        String recommendedSite = "B";
        double recommendedScore = 7.3;
        double availableTime = 180;

        String[] sites = {"A", "B", "C"};
        double[] scores = {6.7, 7.3, 8.2};
        double[] requiredTimes = {115, 95, 195};

        System.out.println("=== MarsWalk AI Decision Explanation ===");

        for (int i = 0; i < sites.length; i++) {

            String explanation = explainDecision(
                sites[i],
                scores[i],
                requiredTimes[i],
                availableTime,
                recommendedSite,
                recommendedScore
            );

            System.out.println(explanation);
        }
    }
}
