
public class ScientificEvaluator {

    // Calculate scientific site score
    static double calculateScore(
            double importance,
            double accessibility,
            double timeSuitability) {

        return (0.5 * importance)
             + (0.3 * accessibility)
             + (0.2 * timeSuitability);
    }

    public static void main(String[] args) {

        // Experimental scientific sites
        String[] sites = {"Site A", "Site B", "Site C"};

        double[] importance = {9, 6, 8};
        double[] accessibility = {4, 9, 8};
        double[] timeSuitability = {5, 8, 9};

        double bestScore = -1;
        String bestSite = "";

        System.out.println("=== MarsWalk Scientific Evaluation ===");

        for (int i = 0; i < sites.length; i++) {

            double score = calculateScore(
                importance[i],
                accessibility[i],
                timeSuitability[i]
            );

            System.out.println(sites[i] + " Score: " + score);

            if (score > bestScore) {
                bestScore = score;
                bestSite = sites[i];
            }
        }

        System.out.println("-------------------------");
        System.out.println("Recommended Scientific Site: " + bestSite);
        System.out.println("Best Scientific Score: " + bestScore);
    }
}
