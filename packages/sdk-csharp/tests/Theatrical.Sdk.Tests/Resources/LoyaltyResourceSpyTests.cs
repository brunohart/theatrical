using Xunit;
using Theatrical.Sdk.Resources;
using Theatrical.Sdk.Types;
using Theatrical.Sdk.Errors;
using Theatrical.Sdk.Tests.TestInfrastructure;

namespace Theatrical.Sdk.Tests.Resources;

public sealed class LoyaltyResourceSpyTests
{
    private static LoyaltyResource CreateResource(SpyHttpClient spy)
        => new(spy);

    private static LoyaltyMember CreateMember(
        string? id = null,
        string? name = null,
        string? tier = null,
        int points = 1250)
    {
        return new LoyaltyMember
        {
            Id = id ?? "mem_001",
            Name = name ?? "Jane Campion",
            Tier = tier ?? LoyaltyTiers.Gold,
            Points = points,
            PointsBalance = points,
            Email = "jane@example.com",
            JoinedAt = "2024-01-15T00:00:00+12:00",
        };
    }

    private static PointsTransaction CreateTransaction(
        string? id = null,
        string? type = null,
        int points = 50)
    {
        return new PointsTransaction
        {
            Id = id ?? "txn_001",
            Type = type ?? "earn",
            Points = points,
            Description = "Ticket purchase",
            OrderId = "ord_001",
            CreatedAt = "2026-04-10T20:00:00+12:00",
        };
    }

    [Fact]
    public async Task GetMemberAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateMember());
        var resource = CreateResource(spy);

        await resource.GetMemberAsync("mem_001");

        Assert.Single(spy.Calls);
        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/loyalty/members/mem_001", spy.LastCall.Path);
    }

    [Fact]
    public async Task GetMemberAsync_returns_member_details()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateMember(name: "Taika Waititi", tier: LoyaltyTiers.Platinum, points: 5000));
        var resource = CreateResource(spy);

        var result = await resource.GetMemberAsync("mem_002");

        Assert.Equal("Taika Waititi", result.Name);
        Assert.Equal(LoyaltyTiers.Platinum, result.Tier);
        Assert.Equal(5000, result.Points);
    }

    [Fact]
    public async Task AuthenticateAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateMember());
        var resource = CreateResource(spy);

        await resource.AuthenticateAsync("jane@example.com", "password123");

        Assert.Equal("POST", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/loyalty/authenticate", spy.LastCall.Path);
    }

    [Fact]
    public async Task AuthenticateAsync_sends_credentials()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateMember());
        var resource = CreateResource(spy);

        await resource.AuthenticateAsync("jane@example.com", "password123");

        Assert.NotNull(spy.LastCall.Body);
    }

    [Fact]
    public async Task GetPointsBalanceAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new PointsBalance { Points = 1250, LifetimePoints = 8500 });
        var resource = CreateResource(spy);

        await resource.GetPointsBalanceAsync("mem_001");

        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/loyalty/members/mem_001/points", spy.LastCall.Path);
    }

    [Fact]
    public async Task GetPointsBalanceAsync_returns_balance()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new PointsBalance { Points = 1250, LifetimePoints = 8500 });
        var resource = CreateResource(spy);

        var result = await resource.GetPointsBalanceAsync("mem_001");

        Assert.Equal(1250, result.Points);
        Assert.Equal(8500, result.LifetimePoints);
    }

    [Fact]
    public async Task GetHistoryAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new PaginatedResponse<PointsTransaction>
        {
            Data = [CreateTransaction()],
            Total = 1,
            HasMore = false,
        });
        var resource = CreateResource(spy);

        await resource.GetHistoryAsync("mem_001");

        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/loyalty/members/mem_001/history", spy.LastCall.Path);
    }

    [Fact]
    public async Task GetHistoryAsync_passes_type_filter()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new PaginatedResponse<PointsTransaction>
        {
            Data = [CreateTransaction(type: "earn")],
            Total = 1,
            HasMore = false,
        });
        var resource = CreateResource(spy);

        await resource.GetHistoryAsync("mem_001", new PointsHistoryFilter { Type = "earn" });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("earn", spy.LastCall.QueryParams["type"]);
    }

    [Fact]
    public async Task GetHistoryAsync_passes_date_range()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new PaginatedResponse<PointsTransaction>
        {
            Data = [],
            Total = 0,
            HasMore = false,
        });
        var resource = CreateResource(spy);

        await resource.GetHistoryAsync("mem_001", new PointsHistoryFilter
        {
            Since = "2026-01-01",
            Until = "2026-06-01",
        });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("2026-01-01", spy.LastCall.QueryParams["since"]);
        Assert.Equal("2026-06-01", spy.LastCall.QueryParams["until"]);
    }

    [Fact]
    public async Task GetHistoryAsync_passes_cursor_pagination()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new PaginatedResponse<PointsTransaction>
        {
            Data = [CreateTransaction()],
            Total = 50,
            HasMore = true,
            NextCursor = "cur_page2",
        });
        var resource = CreateResource(spy);

        await resource.GetHistoryAsync("mem_001", new PointsHistoryFilter { Limit = 10, Cursor = "cur_page1" });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("10", spy.LastCall.QueryParams["limit"]);
        Assert.Equal("cur_page1", spy.LastCall.QueryParams["cursor"]);
    }

    [Fact]
    public async Task GetHistoryAsync_sends_no_params_without_filter()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new PaginatedResponse<PointsTransaction>
        {
            Data = [],
            Total = 0,
            HasMore = false,
        });
        var resource = CreateResource(spy);

        await resource.GetHistoryAsync("mem_001");

        Assert.Null(spy.LastCall.QueryParams);
    }

    [Fact]
    public async Task ListRedemptionOptionsAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[]
        {
            new RedemptionOption { Id = "opt_001", Name = "Free Popcorn", PointsCost = 500, Category = "food" },
        });
        var resource = CreateResource(spy);

        await resource.ListRedemptionOptionsAsync("mem_001");

        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/loyalty/members/mem_001/redemptions", spy.LastCall.Path);
    }

    [Fact]
    public async Task ListRedemptionOptionsAsync_returns_options()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[]
        {
            new RedemptionOption { Id = "opt_001", Name = "Free Popcorn", PointsCost = 500 },
            new RedemptionOption { Id = "opt_002", Name = "Free Ticket", PointsCost = 2000 },
        });
        var resource = CreateResource(spy);

        var result = await resource.ListRedemptionOptionsAsync("mem_001");

        Assert.Equal(2, result.Length);
        Assert.Equal(500, result[0].PointsCost);
        Assert.Equal("Free Ticket", result[1].Name);
    }

    [Fact]
    public async Task RedeemPointsAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateTransaction(type: "redeem", points: -500));
        var resource = CreateResource(spy);

        await resource.RedeemPointsAsync("mem_001", new RedeemPointsInput
        {
            OptionId = "opt_001",
            OrderId = "ord_001",
        });

        Assert.Equal("POST", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/loyalty/members/mem_001/redeem", spy.LastCall.Path);
    }

    [Fact]
    public async Task RedeemPointsAsync_sends_input()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateTransaction(type: "redeem", points: -500));
        var resource = CreateResource(spy);

        await resource.RedeemPointsAsync("mem_001", new RedeemPointsInput
        {
            OptionId = "opt_001",
            Quantity = 2,
        });

        Assert.NotNull(spy.LastCall.Body);
    }

    [Fact]
    public async Task GetMemberAsync_propagates_not_found_error()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueError(new NotFoundException("Member", "mem_nonexistent"));
        var resource = CreateResource(spy);

        await Assert.ThrowsAsync<NotFoundException>(() => resource.GetMemberAsync("mem_nonexistent"));
    }

    [Fact]
    public async Task AuthenticateAsync_propagates_auth_error()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueError(new AuthenticationException("Invalid credentials"));
        var resource = CreateResource(spy);

        await Assert.ThrowsAsync<AuthenticationException>(() =>
            resource.AuthenticateAsync("bad@example.com", "wrong"));
    }
}
