using System.Text.Json;
using Theatrical.Sdk.Http;

namespace Theatrical.Sdk.Mock;

internal static class DefaultFixtures
{
    public static Dictionary<string, JsonElement> All { get; } = BuildFixtures();

    private static JsonElement J(object value) => JsonSerializer.SerializeToElement(value, JsonDefaults.Options);

    private static Dictionary<string, JsonElement> BuildFixtures()
    {
        var fixtures = new Dictionary<string, JsonElement>();

        // --- Films ---

        fixtures["/ocapi/v1/films/now-showing"] = J(new object[]
        {
            new
            {
                id = "film_holdovers_2023",
                title = "The Holdovers",
                synopsis = "A cranky history teacher is forced to stay on campus over the holidays with a troubled student.",
                genres = new[] { "drama", "comedy" },
                runtime = 133,
                rating = "M",
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
                rating = "R18",
                releaseDate = "2026-02-01",
                director = "Yorgos Lanthimos",
                isNowShowing = true,
                isComingSoon = false,
            },
        });

        fixtures["/ocapi/v1/films/coming-soon"] = J(new object[]
        {
            new
            {
                id = "film_dune2_2024",
                title = "Dune: Part Two",
                synopsis = "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators.",
                genres = new[] { "sci-fi", "adventure" },
                runtime = 166,
                rating = "M",
                releaseDate = "2026-05-01",
                director = "Denis Villeneuve",
                isNowShowing = false,
                isComingSoon = true,
            },
        });

        fixtures["/ocapi/v1/films/:id"] = J(new
        {
            id = "film_holdovers_2023",
            title = "The Holdovers",
            synopsis = "A cranky history teacher is forced to stay on campus over the holidays with a troubled student.",
            genres = new[] { "drama", "comedy" },
            runtime = 133,
            rating = "M",
            releaseDate = "2026-03-14",
            director = "Alexander Payne",
            isNowShowing = true,
            isComingSoon = false,
        });

        fixtures["/ocapi/v1/films/:id/detail"] = J(new
        {
            id = "film_holdovers_2023",
            title = "The Holdovers",
            synopsis = "A cranky history teacher is forced to stay on campus over the holidays with a troubled student.",
            genres = new[] { "drama", "comedy" },
            runtimeMinutes = 133,
            rating = "M",
            releaseDate = "2026-03-14",
            director = "Alexander Payne",
            cast = new[]
            {
                new { name = "Paul Giamatti", role = "Paul Hunham" },
                new { name = "Da'Vine Joy Randolph", role = "Mary Lamb" },
            },
            crew = new[]
            {
                new { name = "Alexander Payne", department = "Directing", job = "Director" },
            },
            ratings = new[]
            {
                new { source = "IMDB", value = "7.9" },
                new { source = "Rotten Tomatoes", value = "96%" },
            },
            formats = new[] { "2D" },
            languages = new[] { "English" },
        });

        fixtures["/ocapi/v1/films"] = J(new object[]
        {
            new
            {
                id = "film_holdovers_2023",
                title = "The Holdovers",
                genres = new[] { "drama", "comedy" },
                runtime = 133,
                rating = "M",
                isNowShowing = true,
                isComingSoon = false,
            },
        });

        fixtures["/ocapi/v1/films/search"] = J(new object[]
        {
            new
            {
                id = "film_holdovers_2023",
                title = "The Holdovers",
                genres = new[] { "drama", "comedy" },
                runtime = 133,
                rating = "M",
                isNowShowing = true,
                isComingSoon = false,
            },
        });

        // --- Sessions ---

        fixtures["/ocapi/v1/sessions"] = J(new
        {
            sessions = new object[]
            {
                new
                {
                    id = "ses_roxy_holdovers_20260427_1915",
                    filmId = "film_holdovers_2023",
                    filmTitle = "The Holdovers",
                    siteId = "site_roxy_wellington",
                    screenId = "screen_roxy_3",
                    screenName = "Screen 3",
                    startTime = "2026-04-27T19:15:00+12:00",
                    endTime = "2026-04-27T21:28:00+12:00",
                    format = "2D",
                    isBookable = true,
                    isSoldOut = false,
                    seatsAvailable = 42,
                    seatsTotal = 120,
                    priceFrom = 16.50m,
                    currency = "NZD",
                    attributes = new Dictionary<string, string>(),
                },
            },
            total = 1,
            hasMore = false,
        });

        fixtures["/ocapi/v1/sessions/:id"] = J(new
        {
            id = "ses_roxy_holdovers_20260427_1915",
            filmId = "film_holdovers_2023",
            filmTitle = "The Holdovers",
            siteId = "site_roxy_wellington",
            screenId = "screen_roxy_3",
            screenName = "Screen 3",
            startTime = "2026-04-27T19:15:00+12:00",
            endTime = "2026-04-27T21:28:00+12:00",
            format = "2D",
            isBookable = true,
            isSoldOut = false,
            seatsAvailable = 42,
            seatsTotal = 120,
            priceFrom = 16.50m,
            currency = "NZD",
            attributes = new Dictionary<string, string>(),
        });

        fixtures["/ocapi/v1/sessions/:id/seat-plan"] = J(new
        {
            sessionId = "ses_roxy_holdovers_20260427_1915",
            screenName = "Screen 3",
            seats = new object[]
            {
                new { id = "seat_h12", row = "H", number = 12, status = "available", x = 12.0, y = 8.0, isAccessible = false },
                new { id = "seat_h13", row = "H", number = 13, status = "available", x = 13.0, y = 8.0, isAccessible = false },
                new { id = "seat_h14", row = "H", number = 14, status = "taken", x = 14.0, y = 8.0, isAccessible = false },
                new { id = "seat_a1", row = "A", number = 1, status = "wheelchair", x = 1.0, y = 1.0, isAccessible = true },
            },
            rowCount = 12,
            screenPosition = "top",
            availableCount = 42,
            totalCount = 120,
        });

        // --- Sessions ticket types ---

        fixtures["/ocapi/v1/sessions/:id/ticket-types"] = J(new object[]
        {
            new { id = "tt_adult", name = "Adult", price = 19.50m, description = "Standard adult ticket", category = "standard", isAvailable = true },
            new { id = "tt_child", name = "Child", price = 12.00m, description = "Children under 13", category = "standard", isAvailable = true },
            new { id = "tt_senior", name = "Senior", price = 14.50m, description = "65 and over", category = "concession", isAvailable = true },
        });

        // --- Sites ---

        fixtures["/ocapi/v1/sites"] = J(new object[]
        {
            new
            {
                id = "site_roxy_wellington",
                name = "Roxy Cinema",
                address = "5 Park Road, Miramar",
                city = "Wellington",
                country = "NZ",
                latitude = -41.3007,
                longitude = 174.7766,
                timezone = "Pacific/Auckland",
                isActive = true,
                screenCount = 3,
                features = new[] { "bar", "cafe", "wheelchair-accessible" },
            },
            new
            {
                id = "site_embassy_wellington",
                name = "Embassy Theatre",
                address = "10 Kent Terrace",
                city = "Wellington",
                country = "NZ",
                latitude = -41.2945,
                longitude = 174.7835,
                timezone = "Pacific/Auckland",
                isActive = true,
                screenCount = 1,
                features = new[] { "heritage", "premiere-venue", "wheelchair-accessible" },
            },
        });

        fixtures["/ocapi/v1/sites/:id"] = J(new
        {
            id = "site_roxy_wellington",
            name = "Roxy Cinema",
            address = "5 Park Road, Miramar",
            city = "Wellington",
            country = "NZ",
            latitude = -41.3007,
            longitude = 174.7766,
            timezone = "Pacific/Auckland",
            isActive = true,
            screenCount = 3,
            features = new[] { "bar", "cafe", "wheelchair-accessible" },
        });

        fixtures["/ocapi/v1/sites/:id/screens"] = J(new object[]
        {
            new { id = "screen_roxy_1", name = "Screen 1", capacity = 200, formats = new[] { "2D", "3D" }, isAccessible = true },
            new { id = "screen_roxy_2", name = "Screen 2", capacity = 150, formats = new[] { "2D" }, isAccessible = true },
            new { id = "screen_roxy_3", name = "Screen 3", capacity = 120, formats = new[] { "2D" }, isAccessible = false },
        });

        // --- Loyalty ---

        fixtures["/ocapi/v1/loyalty/members/:id"] = J(new
        {
            id = "mem_hobbiton_jane",
            name = "Jane Smith",
            email = "jane@example.co.nz",
            tier = "Gold",
            points = 4200,
            pointsBalance = 4200,
            joinedAt = "2024-01-15T00:00:00+12:00",
        });

        fixtures["/ocapi/v1/loyalty/members/:id/points"] = J(new
        {
            points = 4200,
            lifetimePoints = 12800,
        });

        fixtures["/ocapi/v1/loyalty/members/:id/history"] = J(new
        {
            data = new object[]
            {
                new { id = "txn_001", type = "earn", points = 200, description = "Ticket purchase — The Holdovers", orderId = "ord_roxy_2026042701", createdAt = "2026-04-27T19:00:00+12:00" },
                new { id = "txn_002", type = "redeem", points = -500, description = "Popcorn combo reward", createdAt = "2026-04-20T18:30:00+12:00" },
            },
            total = 2,
            hasMore = false,
        });

        fixtures["/ocapi/v1/loyalty/members/:id/redemptions"] = J(new object[]
        {
            new { id = "redeem_free_popcorn", name = "Free Large Popcorn", pointsCost = 500, description = "Redeem for one large popcorn", category = "food" },
            new { id = "redeem_ticket_discount", name = "$5 Ticket Discount", pointsCost = 1000, description = "Discount on any standard ticket", category = "tickets" },
        });

        fixtures["/ocapi/v1/loyalty/authenticate"] = J(new
        {
            id = "mem_hobbiton_jane",
            name = "Jane Smith",
            email = "jane@example.co.nz",
            tier = "Gold",
            points = 4200,
            joinedAt = "2024-01-15T00:00:00+12:00",
        });

        // --- Orders ---

        fixtures["/ocapi/v1/orders/:id"] = J(new
        {
            id = "ord_roxy_2026042701",
            sessionId = "ses_roxy_holdovers_20260427_1915",
            status = "confirmed",
            tickets = new object[]
            {
                new { id = "tkt_001", type = "Adult", seatId = "seat_h12", seatLabel = "H12", price = 19.50m },
                new { id = "tkt_002", type = "Child", seatId = "seat_h13", seatLabel = "H13", price = 12.00m },
            },
            items = Array.Empty<object>(),
            subtotal = 31.50m,
            tax = 4.73m,
            discount = 0m,
            total = 36.23m,
            currency = "NZD",
            createdAt = "2026-04-27T18:00:00+12:00",
            updatedAt = "2026-04-27T18:05:00+12:00",
            confirmedAt = "2026-04-27T18:05:00+12:00",
        });

        fixtures["/ocapi/v1/members/:id/orders"] = J(new
        {
            data = new object[]
            {
                new
                {
                    id = "ord_roxy_2026042701",
                    sessionId = "ses_roxy_holdovers_20260427_1915",
                    status = "confirmed",
                    tickets = new object[]
                    {
                        new { id = "tkt_001", type = "Adult", seatId = "seat_h12", seatLabel = "H12", price = 19.50m },
                    },
                    items = Array.Empty<object>(),
                    subtotal = 19.50m,
                    tax = 2.93m,
                    discount = 0m,
                    total = 22.43m,
                    currency = "NZD",
                    createdAt = "2026-04-27T18:00:00+12:00",
                },
            },
            total = 1,
            hasMore = false,
        });

        // --- Subscriptions ---

        fixtures["/ocapi/v1/subscriptions/plans"] = J(new object[]
        {
            new { id = "plan_cinephile", name = "Cinephile Pass", pricePerMonth = 29.99m, description = "4 standard tickets per month", benefits = new[] { "4x standard tickets", "10% F&B discount" }, isAvailable = true },
            new { id = "plan_unlimited", name = "Unlimited Pass", pricePerMonth = 49.99m, description = "Unlimited standard screenings", benefits = new[] { "Unlimited standard tickets", "20% F&B discount", "Priority seating" }, isAvailable = true },
        });

        fixtures["/ocapi/v1/subscriptions/members/:id"] = J(new
        {
            memberId = "mem_hobbiton_jane",
            planId = "plan_cinephile",
            status = "active",
            startDate = "2026-01-15",
            nextBillingDate = "2026-05-15",
        });

        fixtures["/ocapi/v1/subscriptions/members/:id/usage"] = J(new
        {
            memberId = "mem_hobbiton_jane",
            planId = "plan_cinephile",
            bookingsUsed = 2,
            bookingsRemaining = 2,
            periodStart = "2026-04-15",
            periodEnd = "2026-05-14",
            benefits = new object[]
            {
                new { benefitId = "benefit_tickets", name = "Standard Tickets", used = 2, limit = 4 },
                new { benefitId = "benefit_fnb_discount", name = "F&B Discount", used = 3, limit = (int?)null },
            },
        });

        fixtures["/ocapi/v1/subscriptions/members/:id/benefits/:id/eligibility"] = J(new
        {
            eligible = true,
            usesRemaining = 2,
        });

        // --- Pricing ---

        fixtures["/ocapi/v1/pricing/calculate"] = J(new
        {
            subtotal = 39.00m,
            tax = 5.85m,
            total = 44.85m,
            discount = 0m,
            currency = "NZD",
            breakdown = new object[]
            {
                new { label = "Adult x 2", amount = 39.00m, type = "ticket" },
                new { label = "GST (15%)", amount = 5.85m, type = "tax" },
            },
        });

        fixtures["/ocapi/v1/pricing/apply-coupons"] = J(new
        {
            pricing = new
            {
                subtotal = 39.00m,
                tax = 5.10m,
                total = 39.10m,
                discount = 5.00m,
                currency = "NZD",
            },
            applied = new[] { new { code = "WELCOME5", discount = 5.00m, description = "$5 off your first order" } },
            rejected = Array.Empty<object>(),
        });

        // --- Food & Beverage ---

        fixtures["/ocapi/v1/sites/:id/menu"] = J(new object[]
        {
            new { id = "item_popcorn_large", name = "Large Popcorn", price = 9.50m, category = "popcorn", description = "Freshly popped, butter or salt", dietaryFlags = new[] { "gluten-free" }, isAvailable = true },
            new { id = "item_coke_large", name = "Large Coca-Cola", price = 7.00m, category = "drinks", description = "600ml", dietaryFlags = Array.Empty<string>(), isAvailable = true },
            new { id = "item_nachos", name = "Nachos", price = 11.50m, category = "snacks", description = "With cheese sauce and jalapeños", dietaryFlags = new[] { "vegetarian" }, isAvailable = true },
        });

        fixtures["/ocapi/v1/sites/:id/menu/categories"] = J(new object[]
        {
            new { id = "cat_popcorn", name = "Popcorn", displayOrder = 1 },
            new { id = "cat_drinks", name = "Drinks", displayOrder = 2 },
            new { id = "cat_snacks", name = "Snacks", displayOrder = 3 },
            new { id = "cat_combos", name = "Combos", displayOrder = 4 },
        });

        fixtures["/ocapi/v1/sites/:id/menu/items/:id"] = J(new
        {
            id = "item_popcorn_large",
            name = "Large Popcorn",
            price = 9.50m,
            category = "popcorn",
            description = "Freshly popped, butter or salt",
            dietaryFlags = new[] { "gluten-free" },
            isAvailable = true,
            customizations = new object[]
            {
                new { id = "cust_flavour", name = "Flavour", options = new[] { "Butter", "Salt", "Caramel" } },
            },
        });

        fixtures["/ocapi/v1/sites/:id/menu/combos"] = J(new object[]
        {
            new
            {
                id = "combo_date_night",
                name = "Date Night Combo",
                price = 22.00m,
                savings = 4.50m,
                description = "2x Large Popcorn + 2x Large Drink",
                items = new object[]
                {
                    new { menuItemId = "item_popcorn_large", name = "Large Popcorn", quantity = 2 },
                    new { menuItemId = "item_coke_large", name = "Large Coca-Cola", quantity = 2 },
                },
            },
        });

        return fixtures;
    }
}
