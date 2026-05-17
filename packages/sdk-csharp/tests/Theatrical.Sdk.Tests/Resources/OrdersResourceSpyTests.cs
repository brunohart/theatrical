using Xunit;
using Theatrical.Sdk.Resources;
using Theatrical.Sdk.Types;
using Theatrical.Sdk.Errors;
using Theatrical.Sdk.Tests.TestInfrastructure;

namespace Theatrical.Sdk.Tests.Resources;

public sealed class OrdersResourceSpyTests
{
    private static readonly TheatricalClientOptions DefaultOptions = new() { ApiKey = "test-key" };

    private static OrdersResource CreateResource(SpyHttpClient spy)
        => new(spy, DefaultOptions);

    private static Order CreateOrder(
        string? id = null,
        string? status = null,
        string? sessionId = null,
        decimal total = 39.00m)
    {
        return new Order
        {
            Id = id ?? "ord_001",
            SessionId = sessionId ?? "ses_roxy_holdovers_20260410_1915",
            Status = status ?? OrderStatuses.Draft,
            Tickets =
            [
                new Ticket { Id = "tkt_001", Type = "adult", SeatId = "H7", SeatLabel = "H7", Price = 19.50m },
                new Ticket { Id = "tkt_002", Type = "adult", SeatId = "H8", SeatLabel = "H8", Price = 19.50m },
            ],
            Items = [],
            Subtotal = 39.00m,
            Tax = 5.22m,
            Discount = 0m,
            Total = total,
            Currency = "NZD",
            CreatedAt = "2026-04-10T18:00:00+12:00",
        };
    }

    [Fact]
    public async Task CreateAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateOrder());
        var resource = CreateResource(spy);

        var request = new CreateOrderRequest
        {
            SessionId = "ses_001",
            Tickets = [new TicketRequest { Type = "adult", SeatId = "H7" }],
        };
        await resource.CreateAsync(request);

        Assert.Single(spy.Calls);
        Assert.Equal("POST", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/orders", spy.LastCall.Path);
    }

    [Fact]
    public async Task CreateAsync_sends_request_body()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateOrder());
        var resource = CreateResource(spy);

        var request = new CreateOrderRequest
        {
            SessionId = "ses_001",
            Tickets = [new TicketRequest { Type = "adult", SeatId = "H7" }],
            LoyaltyMemberId = "mem_001",
        };
        await resource.CreateAsync(request);

        Assert.NotNull(spy.LastCall.Body);
    }

    [Fact]
    public async Task CreateAsync_returns_draft_order()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateOrder(status: OrderStatuses.Draft));
        var resource = CreateResource(spy);

        var result = await resource.CreateAsync(new CreateOrderRequest
        {
            SessionId = "ses_001",
            Tickets = [new TicketRequest { Type = "adult", SeatId = "H7" }],
        });

        Assert.Equal(OrderStatuses.Draft, result.Status);
        Assert.NotNull(result.Tickets);
        Assert.Equal(2, result.Tickets.Length);
    }

    [Fact]
    public async Task GetAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateOrder());
        var resource = CreateResource(spy);

        await resource.GetAsync("ord_001");

        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/orders/ord_001", spy.LastCall.Path);
    }

    [Fact]
    public async Task GetAsync_returns_order_totals()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateOrder(total: 44.22m));
        var resource = CreateResource(spy);

        var result = await resource.GetAsync("ord_001");

        Assert.Equal(39.00m, result.Subtotal);
        Assert.Equal(5.22m, result.Tax);
        Assert.Equal(44.22m, result.Total);
        Assert.Equal("NZD", result.Currency);
    }

    [Fact]
    public async Task AddTicketsAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateOrder());
        var resource = CreateResource(spy);

        await resource.AddTicketsAsync("ord_001", new AddTicketsInput
        {
            Tickets = [new TicketRequest { Type = "child", SeatId = "H9" }],
        });

        Assert.Equal("POST", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/orders/ord_001/tickets", spy.LastCall.Path);
    }

    [Fact]
    public async Task AddItemsAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateOrder());
        var resource = CreateResource(spy);

        await resource.AddItemsAsync("ord_001", new AddItemsInput
        {
            Items = [new OrderItemRequest { MenuItemId = "item_popcorn", Quantity = 2 }],
        });

        Assert.Equal("POST", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/orders/ord_001/items", spy.LastCall.Path);
    }

    [Fact]
    public async Task ConfirmAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateOrder(status: OrderStatuses.Confirmed));
        var resource = CreateResource(spy);

        await resource.ConfirmAsync("ord_001");

        Assert.Equal("POST", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/orders/ord_001/confirm", spy.LastCall.Path);
    }

    [Fact]
    public async Task ConfirmAsync_returns_confirmed_status()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateOrder(status: OrderStatuses.Confirmed));
        var resource = CreateResource(spy);

        var result = await resource.ConfirmAsync("ord_001");

        Assert.Equal(OrderStatuses.Confirmed, result.Status);
    }

    [Fact]
    public async Task CancelAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateOrder(status: OrderStatuses.Cancelled));
        var resource = CreateResource(spy);

        await resource.CancelAsync("ord_001");

        Assert.Equal("POST", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/orders/ord_001/cancel", spy.LastCall.Path);
    }

    [Fact]
    public async Task CancelAsync_returns_cancelled_status()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateOrder(status: OrderStatuses.Cancelled));
        var resource = CreateResource(spy);

        var result = await resource.CancelAsync("ord_001");

        Assert.Equal(OrderStatuses.Cancelled, result.Status);
    }

    [Fact]
    public async Task ApplyLoyaltyAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateOrder());
        var resource = CreateResource(spy);

        await resource.ApplyLoyaltyAsync("ord_001", new ApplyLoyaltyInput
        {
            MemberId = "mem_001",
            PointsToRedeem = 500,
        });

        Assert.Equal("POST", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/orders/ord_001/loyalty", spy.LastCall.Path);
    }

    [Fact]
    public async Task ApplyLoyaltyAsync_sends_input_body()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateOrder());
        var resource = CreateResource(spy);

        await resource.ApplyLoyaltyAsync("ord_001", new ApplyLoyaltyInput
        {
            MemberId = "mem_001",
            PointsToRedeem = 500,
        });

        Assert.NotNull(spy.LastCall.Body);
    }

    [Fact]
    public async Task RefundAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateOrder(status: OrderStatuses.Refunded));
        var resource = CreateResource(spy);

        await resource.RefundAsync("ord_001");

        Assert.Equal("POST", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/orders/ord_001/refund", spy.LastCall.Path);
    }

    [Fact]
    public async Task RefundAsync_returns_refunded_status()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateOrder(status: OrderStatuses.Refunded));
        var resource = CreateResource(spy);

        var result = await resource.RefundAsync("ord_001");

        Assert.Equal(OrderStatuses.Refunded, result.Status);
    }

    [Fact]
    public async Task CompleteAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateOrder(status: OrderStatuses.Completed));
        var resource = CreateResource(spy);

        await resource.CompleteAsync("ord_001");

        Assert.Equal("POST", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/orders/ord_001/complete", spy.LastCall.Path);
    }

    [Fact]
    public async Task CompleteAsync_returns_completed_status()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateOrder(status: OrderStatuses.Completed));
        var resource = CreateResource(spy);

        var result = await resource.CompleteAsync("ord_001");

        Assert.Equal(OrderStatuses.Completed, result.Status);
    }

    [Fact]
    public async Task HistoryAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new PaginatedResponse<Order>
        {
            Data = [CreateOrder()],
            Total = 1,
            HasMore = false,
        });
        var resource = CreateResource(spy);

        await resource.HistoryAsync("mem_001");

        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/members/mem_001/orders", spy.LastCall.Path);
    }

    [Fact]
    public async Task HistoryAsync_passes_status_filter()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new PaginatedResponse<Order>
        {
            Data = [CreateOrder(status: OrderStatuses.Completed)],
            Total = 1,
            HasMore = false,
        });
        var resource = CreateResource(spy);

        await resource.HistoryAsync("mem_001", new OrderHistoryFilter { Status = "completed" });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("completed", spy.LastCall.QueryParams["status"]);
    }

    [Fact]
    public async Task HistoryAsync_passes_date_range_filter()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new PaginatedResponse<Order>
        {
            Data = [],
            Total = 0,
            HasMore = false,
        });
        var resource = CreateResource(spy);

        await resource.HistoryAsync("mem_001", new OrderHistoryFilter
        {
            Since = "2026-01-01",
            Until = "2026-04-10",
        });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("2026-01-01", spy.LastCall.QueryParams["since"]);
        Assert.Equal("2026-04-10", spy.LastCall.QueryParams["until"]);
    }

    [Fact]
    public async Task HistoryAsync_passes_cursor_pagination()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new PaginatedResponse<Order>
        {
            Data = [CreateOrder()],
            Total = 10,
            HasMore = true,
            NextCursor = "cur_page2",
        });
        var resource = CreateResource(spy);

        await resource.HistoryAsync("mem_001", new OrderHistoryFilter
        {
            Limit = 5,
            Cursor = "cur_page1",
        });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("5", spy.LastCall.QueryParams["limit"]);
        Assert.Equal("cur_page1", spy.LastCall.QueryParams["cursor"]);
    }

    [Fact]
    public async Task HistoryAsync_returns_paginated_result()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new PaginatedResponse<Order>
        {
            Data = [CreateOrder(), CreateOrder(id: "ord_002")],
            Total = 15,
            HasMore = true,
            NextCursor = "cur_next",
        });
        var resource = CreateResource(spy);

        var result = await resource.HistoryAsync("mem_001");

        Assert.Equal(2, result.Data.Length);
        Assert.Equal(15, result.Total);
        Assert.True(result.HasMore);
        Assert.Equal("cur_next", result.NextCursor);
    }

    [Fact]
    public async Task CreateAsync_propagates_validation_error()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueError(new ValidationException("Invalid session ID", new Dictionary<string, string> { ["sessionId"] = "required" }));
        var resource = CreateResource(spy);

        await Assert.ThrowsAsync<ValidationException>(() => resource.CreateAsync(new CreateOrderRequest
        {
            SessionId = "",
            Tickets = [],
        }));
    }

    [Fact]
    public async Task GetAsync_propagates_not_found_error()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueError(new NotFoundException("Order", "ord_nonexistent"));
        var resource = CreateResource(spy);

        await Assert.ThrowsAsync<NotFoundException>(() => resource.GetAsync("ord_nonexistent"));
    }

    [Fact]
    public async Task ConfirmAsync_propagates_validation_error()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueError(new ValidationException("Cannot confirm empty order"));
        var resource = CreateResource(spy);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => resource.ConfirmAsync("ord_empty"));
        Assert.Contains("confirm", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task HistoryAsync_sends_no_params_without_filter()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new PaginatedResponse<Order>
        {
            Data = [],
            Total = 0,
            HasMore = false,
        });
        var resource = CreateResource(spy);

        await resource.HistoryAsync("mem_001");

        Assert.Null(spy.LastCall.QueryParams);
    }
}
