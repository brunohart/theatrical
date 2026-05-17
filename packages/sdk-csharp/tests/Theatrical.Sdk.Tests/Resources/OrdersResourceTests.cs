using Xunit;
using Theatrical.Sdk.Types;

namespace Theatrical.Sdk.Tests.Resources;

public sealed class OrdersResourceTests : IDisposable
{
    private readonly TheatricalClient _client = TheatricalClient.CreateMock();

    [Fact]
    public async Task CreateAsync_returns_draft_order()
    {
        var order = await _client.Orders.CreateAsync(new CreateOrderRequest
        {
            SessionId = "ses_roxy_holdovers_20260427_1915",
            Tickets = [new TicketRequest { Type = "Adult", SeatId = "seat_h12" }],
        });

        Assert.NotNull(order);
        Assert.Equal(OrderStatuses.Draft, order.Status);
        Assert.StartsWith("ord_mock_", order.Id);
    }

    [Fact]
    public async Task GetAsync_returns_order_by_id()
    {
        var order = await _client.Orders.GetAsync("ord_roxy_2026042701");

        Assert.NotNull(order);
        Assert.Equal("ord_roxy_2026042701", order.Id);
        Assert.Equal(OrderStatuses.Confirmed, order.Status);
        Assert.Equal("ses_roxy_holdovers_20260427_1915", order.SessionId);
        Assert.NotNull(order.Tickets);
        Assert.Equal(2, order.Tickets.Length);
        Assert.Equal("Adult", order.Tickets[0].Type);
        Assert.Equal(19.50m, order.Tickets[0].Price);
        Assert.Equal("NZD", order.Currency);
        Assert.Equal(36.23m, order.Total);
    }

    [Fact]
    public async Task ConfirmAsync_posts_to_confirm_endpoint()
    {
        var order = await _client.Orders.ConfirmAsync("ord_roxy_2026042701");

        Assert.NotNull(order);
    }

    [Fact]
    public async Task CancelAsync_posts_to_cancel_endpoint()
    {
        var order = await _client.Orders.CancelAsync("ord_roxy_2026042701");

        Assert.NotNull(order);
    }

    [Fact]
    public async Task HistoryAsync_returns_paginated_orders()
    {
        var result = await _client.Orders.HistoryAsync("mem_hobbiton_jane");

        Assert.NotNull(result);
        Assert.NotEmpty(result.Data);
        Assert.Equal(1, result.Total);
        Assert.False(result.HasMore);
    }

    public void Dispose() => _client.Dispose();
}
