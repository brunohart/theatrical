using Xunit;
using Theatrical.Sdk.Resources;
using Theatrical.Sdk.Types;
using Theatrical.Sdk.Errors;
using Theatrical.Sdk.Tests.TestInfrastructure;

namespace Theatrical.Sdk.Tests.Resources;

public sealed class SessionsResourceSpyTests
{
    private static readonly TheatricalClientOptions DefaultOptions = new() { ApiKey = "test-key" };

    private static SessionsResource CreateResource(SpyHttpClient spy)
        => new(spy, DefaultOptions);

    private static SessionListResponse CreateSessionListResponse(
        Session[]? sessions = null,
        int? total = null,
        bool hasMore = false,
        int? nextOffset = null,
        string? nextCursor = null)
    {
        var s = sessions ?? [CreateSession()];
        return new SessionListResponse
        {
            Sessions = s,
            Total = total ?? s.Length,
            HasMore = hasMore,
            NextOffset = nextOffset,
            NextCursor = nextCursor,
        };
    }

    private static Session CreateSession(
        string? id = null,
        string? filmTitle = null,
        string? siteId = null,
        string? format = null,
        bool isBookable = true,
        bool isSoldOut = false,
        int seatsAvailable = 74,
        int seatsTotal = 120)
    {
        return new Session
        {
            Id = id ?? "ses_roxy_holdovers_20260410_1915",
            FilmId = "film_holdovers_2023",
            FilmTitle = filmTitle ?? "The Holdovers",
            SiteId = siteId ?? "site_roxy_wellington",
            ScreenId = "scr_roxy_3",
            ScreenName = "Screen 3",
            StartTime = "2026-04-10T19:15:00+12:00",
            EndTime = "2026-04-10T21:42:00+12:00",
            Format = format ?? "2D",
            IsBookable = isBookable,
            IsSoldOut = isSoldOut,
            SeatsAvailable = seatsAvailable,
            SeatsTotal = seatsTotal,
            PriceFrom = 19.50m,
            Currency = "NZD",
            Attributes = [],
        };
    }

    private static SeatAvailability CreateSeatAvailability()
    {
        return new SeatAvailability
        {
            SessionId = "ses_roxy_holdovers_20260410_1915",
            ScreenName = "Screen 3",
            RowCount = 10,
            ScreenPosition = "top",
            AvailableCount = 74,
            TotalCount = 120,
            Seats =
            [
                new Seat { Id = "H7", Row = "H", Number = 7, Status = "available", X = 7, Y = 8, IsAccessible = false },
                new Seat { Id = "H8", Row = "H", Number = 8, Status = "available", X = 8, Y = 8, IsAccessible = false },
                new Seat { Id = "A1", Row = "A", Number = 1, Status = "wheelchair", X = 1, Y = 1, IsAccessible = true },
                new Seat { Id = "B3", Row = "B", Number = 3, Status = "taken", X = 3, Y = 2, IsAccessible = false },
            ],
        };
    }

    [Fact]
    public async Task ListAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSessionListResponse());
        var resource = CreateResource(spy);

        await resource.ListAsync();

        Assert.Single(spy.Calls);
        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/sessions", spy.LastCall.Path);
    }

    [Fact]
    public async Task ListAsync_passes_siteId_filter()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSessionListResponse());
        var resource = CreateResource(spy);

        await resource.ListAsync(new SessionFilter { SiteId = "site_roxy_wellington" });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("site_roxy_wellington", spy.LastCall.QueryParams["siteId"]);
    }

    [Fact]
    public async Task ListAsync_passes_date_and_format_filters()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSessionListResponse());
        var resource = CreateResource(spy);

        await resource.ListAsync(new SessionFilter { Date = "2026-04-10", Format = "IMAX" });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("2026-04-10", spy.LastCall.QueryParams["date"]);
        Assert.Equal("IMAX", spy.LastCall.QueryParams["format"]);
    }

    [Fact]
    public async Task ListAsync_passes_bookableOnly_flag()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSessionListResponse());
        var resource = CreateResource(spy);

        await resource.ListAsync(new SessionFilter { BookableOnly = true });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("true", spy.LastCall.QueryParams["bookableOnly"]);
    }

    [Fact]
    public async Task ListAsync_returns_empty_when_no_sessions()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSessionListResponse(sessions: [], total: 0));
        var resource = CreateResource(spy);

        var result = await resource.ListAsync();

        Assert.Empty(result.Sessions);
        Assert.Equal(0, result.Total);
        Assert.False(result.HasMore);
    }

    [Fact]
    public async Task ListAsync_returns_film_title_and_format()
    {
        var spy = new SpyHttpClient();
        var session = CreateSession(filmTitle: "Oppenheimer", format: "IMAX3D");
        spy.EnqueueResponse(CreateSessionListResponse(sessions: [session]));
        var resource = CreateResource(spy);

        var result = await resource.ListAsync();

        Assert.Equal("Oppenheimer", result.Sessions[0].FilmTitle);
        Assert.Equal("IMAX3D", result.Sessions[0].Format);
    }

    [Fact]
    public async Task ListAsync_returns_multiple_sessions()
    {
        var spy = new SpyHttpClient();
        var sessions = new[]
        {
            CreateSession(id: "ses_001", siteId: "site_roxy_wellington"),
            CreateSession(id: "ses_002", siteId: "site_embassy_wellington", filmTitle: "Dune: Part Two", format: "IMAX"),
        };
        spy.EnqueueResponse(CreateSessionListResponse(sessions: sessions, total: 2));
        var resource = CreateResource(spy);

        var result = await resource.ListAsync();

        Assert.Equal(2, result.Sessions.Length);
        Assert.Equal("site_roxy_wellington", result.Sessions[0].SiteId);
        Assert.Equal("IMAX", result.Sessions[1].Format);
    }

    [Fact]
    public async Task GetAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSession());
        var resource = CreateResource(spy);

        await resource.GetAsync("ses_roxy_holdovers_20260410_1915");

        Assert.Equal("/ocapi/v1/sessions/ses_roxy_holdovers_20260410_1915", spy.LastCall.Path);
    }

    [Fact]
    public async Task GetAsync_returns_bookability_flags()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSession(isBookable: false, isSoldOut: true, seatsAvailable: 0));
        var resource = CreateResource(spy);

        var result = await resource.GetAsync("ses_001");

        Assert.False(result.IsBookable);
        Assert.True(result.IsSoldOut);
        Assert.Equal(0, result.SeatsAvailable);
    }

    [Fact]
    public async Task GetAvailabilityAsync_calls_seat_plan_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSeatAvailability());
        var resource = CreateResource(spy);

        await resource.GetAvailabilityAsync("ses_roxy_holdovers_20260410_1915");

        Assert.Equal("/ocapi/v1/sessions/ses_roxy_holdovers_20260410_1915/seat-plan", spy.LastCall.Path);
    }

    [Fact]
    public async Task GetAvailabilityAsync_returns_seat_counts()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSeatAvailability());
        var resource = CreateResource(spy);

        var result = await resource.GetAvailabilityAsync("ses_001");

        Assert.Equal(74, result.AvailableCount);
        Assert.Equal(120, result.TotalCount);
        Assert.Equal("Screen 3", result.ScreenName);
    }

    [Fact]
    public async Task GetAvailabilityAsync_returns_individual_seat_records()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSeatAvailability());
        var resource = CreateResource(spy);

        var result = await resource.GetAvailabilityAsync("ses_001");

        var seatH7 = result.Seats.First(s => s.Id == "H7");
        Assert.Equal("H", seatH7.Row);
        Assert.Equal(7, seatH7.Number);
        Assert.Equal("available", seatH7.Status);
        Assert.False(seatH7.IsAccessible);
    }

    [Fact]
    public async Task GetAvailabilityAsync_identifies_wheelchair_seats()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSeatAvailability());
        var resource = CreateResource(spy);

        var result = await resource.GetAvailabilityAsync("ses_001");

        var wheelchair = result.Seats.Where(s => s.Status == "wheelchair").ToArray();
        Assert.Single(wheelchair);
        Assert.True(wheelchair[0].IsAccessible);
        Assert.Equal("A1", wheelchair[0].Id);
    }

    [Fact]
    public async Task GetAvailabilityAsync_distinguishes_available_from_taken()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSeatAvailability());
        var resource = CreateResource(spy);

        var result = await resource.GetAvailabilityAsync("ses_001");

        Assert.Equal(2, result.Seats.Count(s => s.Status == "available"));
        Assert.Single(result.Seats.Where(s => s.Status == "taken"));
    }

    [Fact]
    public async Task ListAllAsync_yields_all_sessions_single_page()
    {
        var spy = new SpyHttpClient();
        var sessions = new[]
        {
            CreateSession(id: "ses_001"),
            CreateSession(id: "ses_002", filmTitle: "Perfect Days"),
        };
        spy.EnqueueResponse(CreateSessionListResponse(sessions: sessions, hasMore: false));
        var resource = CreateResource(spy);

        var collected = new List<Session>();
        await foreach (var session in resource.ListAllAsync())
            collected.Add(session);

        Assert.Equal(2, collected.Count);
        Assert.Equal("ses_001", collected[0].Id);
        Assert.Equal("Perfect Days", collected[1].FilmTitle);
        Assert.Single(spy.Calls);
    }

    [Fact]
    public async Task ListAllAsync_auto_paginates_when_hasMore()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSessionListResponse(
            sessions: [CreateSession(id: "ses_p1_001"), CreateSession(id: "ses_p1_002")],
            total: 3, hasMore: true, nextOffset: 2));
        spy.EnqueueResponse(CreateSessionListResponse(
            sessions: [CreateSession(id: "ses_p2_001")],
            total: 3, hasMore: false));
        var resource = CreateResource(spy);

        var collected = new List<Session>();
        await foreach (var session in resource.ListAllAsync())
            collected.Add(session);

        Assert.Equal(3, collected.Count);
        Assert.Equal(2, spy.Calls.Count);
    }

    [Fact]
    public async Task ListAllAsync_handles_empty_first_page()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSessionListResponse(sessions: [], total: 0, hasMore: false));
        var resource = CreateResource(spy);

        var collected = new List<Session>();
        await foreach (var session in resource.ListAllAsync())
            collected.Add(session);

        Assert.Empty(collected);
        Assert.Single(spy.Calls);
    }

    [Fact]
    public async Task ListPaginatedAsync_returns_offset_strategy()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSessionListResponse(hasMore: false));
        var resource = CreateResource(spy);

        var page = await resource.ListPaginatedAsync(limit: 10);

        Assert.Equal("offset", page.Strategy);
        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("0", spy.LastCall.QueryParams["offset"]);
    }

    [Fact]
    public async Task ListPaginatedAsync_returns_cursor_strategy_when_cursor_given()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSessionListResponse(hasMore: true, nextCursor: "cur_next"));
        var resource = CreateResource(spy);

        var page = await resource.ListPaginatedAsync(cursor: "cur_page2");

        Assert.Equal("cursor", page.Strategy);
        Assert.Equal("cur_next", page.NextCursor);
        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("cur_page2", spy.LastCall.QueryParams["cursor"]);
        Assert.False(spy.LastCall.QueryParams!.ContainsKey("offset"));
    }

    [Fact]
    public async Task ListAsync_propagates_not_found_error()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueError(new NotFoundException("Session not found", "ses_expired"));
        var resource = CreateResource(spy);

        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            resource.ListAsync(new SessionFilter { SiteId = "site_nonexistent" }));
        Assert.Contains("not found", ex.Message);
    }

    [Fact]
    public async Task GetAsync_propagates_error()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueError(new NotFoundException("Session not found", "ses_expired"));
        var resource = CreateResource(spy);

        await Assert.ThrowsAsync<NotFoundException>(() => resource.GetAsync("ses_expired"));
    }
}
