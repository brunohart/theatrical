using Xunit;
using Theatrical.Sdk.Types;

namespace Theatrical.Sdk.Tests.Resources;

public sealed class SessionsResourceTests : IDisposable
{
    private readonly TheatricalClient _client = TheatricalClient.CreateMock();

    [Fact]
    public async Task ListAsync_returns_sessions()
    {
        var result = await _client.Sessions.ListAsync();

        Assert.NotNull(result);
        Assert.NotEmpty(result.Sessions);
        Assert.Equal("ses_roxy_holdovers_20260427_1915", result.Sessions[0].Id);
        Assert.Equal("The Holdovers", result.Sessions[0].FilmTitle);
        Assert.Equal("site_roxy_wellington", result.Sessions[0].SiteId);
        Assert.Equal("2D", result.Sessions[0].Format);
        Assert.True(result.Sessions[0].IsBookable);
        Assert.False(result.Sessions[0].IsSoldOut);
        Assert.Equal(42, result.Sessions[0].SeatsAvailable);
        Assert.Equal(120, result.Sessions[0].SeatsTotal);
    }

    [Fact]
    public async Task ListAsync_with_filter()
    {
        var result = await _client.Sessions.ListAsync(new SessionFilter { SiteId = "site_roxy_wellington" });

        Assert.NotNull(result);
        Assert.NotEmpty(result.Sessions);
    }

    [Fact]
    public async Task ListPaginatedAsync_returns_paginated_response()
    {
        var result = await _client.Sessions.ListPaginatedAsync(limit: 25);

        Assert.NotNull(result);
        Assert.NotEmpty(result.Data);
        Assert.Equal("offset", result.Strategy);
    }

    [Fact]
    public async Task GetAsync_returns_session_by_id()
    {
        var session = await _client.Sessions.GetAsync("ses_roxy_holdovers_20260427_1915");

        Assert.NotNull(session);
        Assert.Equal("ses_roxy_holdovers_20260427_1915", session.Id);
        Assert.Equal("film_holdovers_2023", session.FilmId);
        Assert.Equal("Screen 3", session.ScreenName);
        Assert.Equal("NZD", session.Currency);
    }

    [Fact]
    public async Task GetAvailabilityAsync_returns_seat_map()
    {
        var availability = await _client.Sessions.GetAvailabilityAsync("ses_roxy_holdovers_20260427_1915");

        Assert.NotNull(availability);
        Assert.Equal("ses_roxy_holdovers_20260427_1915", availability.SessionId);
        Assert.Equal("Screen 3", availability.ScreenName);
        Assert.NotEmpty(availability.Seats);
        Assert.Equal(12, availability.RowCount);
        Assert.Equal("top", availability.ScreenPosition);
        Assert.Equal(42, availability.AvailableCount);
        Assert.Equal(120, availability.TotalCount);

        var seat = availability.Seats[0];
        Assert.Equal("seat_h12", seat.Id);
        Assert.Equal("H", seat.Row);
        Assert.Equal(12, seat.Number);
        Assert.Equal(SeatStatuses.Available, seat.Status);
    }

    [Fact]
    public async Task ListAllAsync_yields_all_sessions()
    {
        var sessions = new List<Session>();
        await foreach (var session in _client.Sessions.ListAllAsync())
            sessions.Add(session);

        Assert.NotEmpty(sessions);
        Assert.Equal("ses_roxy_holdovers_20260427_1915", sessions[0].Id);
    }

    public void Dispose() => _client.Dispose();
}
