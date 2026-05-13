using System.Text.Json;

namespace Theatrical.Sdk.Mock;

internal static class DefaultFixtures
{
    public static Dictionary<string, JsonElement> All { get; } = BuildFixtures();

    private static Dictionary<string, JsonElement> BuildFixtures()
    {
        var fixtures = new Dictionary<string, JsonElement>();

        // Films — now showing
        fixtures["/ocapi/v1/films/now-showing"] = JsonSerializer.SerializeToElement(new object[]
        {
            new
            {
                id = "film_holdovers_2023",
                title = "The Holdovers",
                synopsis = "A cranky history teacher is forced to stay on campus over the holidays with a troubled student.",
                genres = new[] { "drama", "comedy" },
                runtime = 133,
                rating = new { classification = "M", description = "Offensive language" },
                releaseDate = "2026-03-14",
                director = "Alexander Payne",
                isNowShowing = true,
                isComingSoon = false,
            },
            new
            {
                id = "film_poor_things_2023",
                title = "Poor Things",
                synopsis = "The incredible tale about the fantastical evolution of Bella Baxter.",
                genres = new[] { "comedy", "drama", "sci-fi" },
                runtime = 141,
                rating = new { classification = "R18", description = "Graphic sexual content, offensive language" },
                releaseDate = "2026-02-01",
                director = "Yorgos Lanthimos",
                isNowShowing = true,
                isComingSoon = false,
            },
        });

        // Films — coming soon
        fixtures["/ocapi/v1/films/coming-soon"] = JsonSerializer.SerializeToElement(new object[]
        {
            new
            {
                id = "film_dune2_2024",
                title = "Dune: Part Two",
                synopsis = "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators.",
                genres = new[] { "sci-fi", "adventure" },
                runtime = 166,
                rating = new { classification = "M", description = "Violence" },
                releaseDate = "2026-05-01",
                director = "Denis Villeneuve",
                isNowShowing = false,
                isComingSoon = true,
            },
        });

        // Films — single
        fixtures["/ocapi/v1/films/:id"] = JsonSerializer.SerializeToElement(new
        {
            id = "film_holdovers_2023",
            title = "The Holdovers",
            synopsis = "A cranky history teacher is forced to stay on campus over the holidays with a troubled student.",
            genres = new[] { "drama", "comedy" },
            runtime = 133,
            rating = new { classification = "M", description = "Offensive language" },
            releaseDate = "2026-03-14",
            director = "Alexander Payne",
            isNowShowing = true,
            isComingSoon = false,
        });

        // Sessions
        fixtures["/ocapi/v1/sessions"] = JsonSerializer.SerializeToElement(new
        {
            sessions = new object[]
            {
                new
                {
                    id = "ses_roxy_holdovers_20260427_1915",
                    filmId = "film_holdovers_2023",
                    filmTitle = "The Holdovers",
                    siteId = "site_roxy_wellington",
                    screenName = "Screen 3",
                    startTime = "2026-04-27T19:15:00+12:00",
                    format = "2D",
                    seatsAvailable = 42,
                    seatsTotal = 120,
                    status = "on-sale",
                },
            },
        });

        // Sites
        fixtures["/ocapi/v1/sites"] = JsonSerializer.SerializeToElement(new object[]
        {
            new
            {
                id = "site_roxy_wellington",
                name = "Roxy Cinema",
                city = "Wellington",
                country = "NZ",
                timezone = "Pacific/Auckland",
                screens = 3,
                features = new[] { "bar", "cafe", "wheelchair-accessible" },
            },
            new
            {
                id = "site_embassy_wellington",
                name = "Embassy Theatre",
                city = "Wellington",
                country = "NZ",
                timezone = "Pacific/Auckland",
                screens = 1,
                features = new[] { "heritage", "premiere-venue", "wheelchair-accessible" },
            },
        });

        // Sites — single
        fixtures["/ocapi/v1/sites/:id"] = JsonSerializer.SerializeToElement(new
        {
            id = "site_roxy_wellington",
            name = "Roxy Cinema",
            city = "Wellington",
            country = "NZ",
            timezone = "Pacific/Auckland",
            screens = 3,
            features = new[] { "bar", "cafe", "wheelchair-accessible" },
        });

        // Loyalty
        fixtures["/ocapi/v1/loyalty/members/:id"] = JsonSerializer.SerializeToElement(new
        {
            id = "mem_hobbiton_jane",
            name = "Jane Smith",
            email = "jane@example.co.nz",
            tier = "Gold",
            pointsBalance = 4200,
            joinedAt = "2024-01-15T00:00:00+12:00",
        });

        // Orders — single
        fixtures["/ocapi/v1/orders/:id"] = JsonSerializer.SerializeToElement(new
        {
            id = "ord_roxy_2026042701",
            status = "confirmed",
            siteId = "site_roxy_wellington",
            sessionId = "ses_roxy_holdovers_20260427_1915",
            tickets = new object[]
            {
                new { type = "Adult", seat = "F12", price = 19.50 },
                new { type = "Child", seat = "F13", price = 12.00 },
            },
            pricing = new { subtotal = 31.50, tax = 4.73, discounts = 0, total = 36.23 },
            createdAt = "2026-04-27T18:00:00+12:00",
        });

        return fixtures;
    }
}
