using Xunit;
using Theatrical.Sdk.Resources;
using Theatrical.Sdk.Types;
using Theatrical.Sdk.Errors;
using Theatrical.Sdk.Tests.TestInfrastructure;

namespace Theatrical.Sdk.Tests.Resources;

public sealed class SubscriptionsResourceSpyTests
{
    private static readonly TheatricalClientOptions DefaultOptions = new() { ApiKey = "test-key" };

    private static SubscriptionsResource CreateResource(SpyHttpClient spy)
        => new(spy, DefaultOptions);

    private static SubscriptionPlan CreatePlan(
        string? id = null,
        string? name = null,
        decimal pricePerMonth = 29.99m,
        bool isAvailable = true)
    {
        return new SubscriptionPlan
        {
            Id = id ?? "plan_unlimited",
            Name = name ?? "Unlimited",
            PricePerMonth = pricePerMonth,
            Description = "Unlimited movies every month",
            Benefits = ["unlimited_2d", "priority_seating", "10pct_fnb"],
            IsAvailable = isAvailable,
        };
    }

    private static MemberSubscription CreateMemberSubscription(
        string? status = null,
        string? memberId = null)
    {
        return new MemberSubscription
        {
            MemberId = memberId ?? "mem_001",
            PlanId = "plan_unlimited",
            Status = status ?? "active",
            StartDate = "2026-01-01",
            NextBillingDate = "2026-05-01",
        };
    }

    [Fact]
    public async Task ListPlansAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreatePlan() });
        var resource = CreateResource(spy);

        await resource.ListPlansAsync();

        Assert.Single(spy.Calls);
        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/subscriptions/plans", spy.LastCall.Path);
    }

    [Fact]
    public async Task ListPlansAsync_passes_siteId()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreatePlan() });
        var resource = CreateResource(spy);

        await resource.ListPlansAsync(siteId: "site_roxy");

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("site_roxy", spy.LastCall.QueryParams["siteId"]);
    }

    [Fact]
    public async Task ListPlansAsync_passes_includeUnavailable()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreatePlan(), CreatePlan(id: "plan_legacy", isAvailable: false) });
        var resource = CreateResource(spy);

        await resource.ListPlansAsync(includeUnavailable: true);

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("true", spy.LastCall.QueryParams["includeUnavailable"]);
    }

    [Fact]
    public async Task ListPlansAsync_sends_no_params_by_default()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreatePlan() });
        var resource = CreateResource(spy);

        await resource.ListPlansAsync();

        Assert.Null(spy.LastCall.QueryParams);
    }

    [Fact]
    public async Task ListPlansAsync_returns_plan_details()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[]
        {
            CreatePlan(name: "Basic", pricePerMonth: 14.99m),
            CreatePlan(name: "Unlimited", pricePerMonth: 29.99m),
        });
        var resource = CreateResource(spy);

        var result = await resource.ListPlansAsync();

        Assert.Equal(2, result.Length);
        Assert.Equal("Basic", result[0].Name);
        Assert.Equal(14.99m, result[0].PricePerMonth);
        Assert.Equal(29.99m, result[1].PricePerMonth);
    }

    [Fact]
    public async Task ListPlansAsync_returns_benefits()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreatePlan() });
        var resource = CreateResource(spy);

        var result = await resource.ListPlansAsync();

        Assert.NotNull(result[0].Benefits);
        Assert.Contains("unlimited_2d", result[0].Benefits);
        Assert.Contains("priority_seating", result[0].Benefits);
    }

    [Fact]
    public async Task GetMemberSubscriptionAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateMemberSubscription());
        var resource = CreateResource(spy);

        await resource.GetMemberSubscriptionAsync("mem_001");

        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/subscriptions/members/mem_001", spy.LastCall.Path);
    }

    [Fact]
    public async Task GetMemberSubscriptionAsync_returns_subscription()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateMemberSubscription(status: "active"));
        var resource = CreateResource(spy);

        var result = await resource.GetMemberSubscriptionAsync("mem_001");

        Assert.Equal("mem_001", result.MemberId);
        Assert.Equal("active", result.Status);
        Assert.Equal("plan_unlimited", result.PlanId);
    }

    [Fact]
    public async Task GetUsageAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new SubscriptionUsage
        {
            MemberId = "mem_001",
            PlanId = "plan_unlimited",
            BookingsUsed = 3,
            BookingsRemaining = null,
            PeriodStart = "2026-04-01",
            PeriodEnd = "2026-04-30",
        });
        var resource = CreateResource(spy);

        await resource.GetUsageAsync("mem_001");

        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/subscriptions/members/mem_001/usage", spy.LastCall.Path);
    }

    [Fact]
    public async Task GetUsageAsync_returns_usage_details()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new SubscriptionUsage
        {
            MemberId = "mem_001",
            PlanId = "plan_unlimited",
            BookingsUsed = 3,
            BookingsRemaining = 7,
            Benefits =
            [
                new BenefitUsage { BenefitId = "unlimited_2d", Name = "2D Movies", Used = 3, Limit = 10 },
            ],
        });
        var resource = CreateResource(spy);

        var result = await resource.GetUsageAsync("mem_001");

        Assert.Equal(3, result.BookingsUsed);
        Assert.Equal(7, result.BookingsRemaining);
        Assert.NotNull(result.Benefits);
        Assert.Single(result.Benefits);
        Assert.Equal("2D Movies", result.Benefits[0].Name);
    }

    [Fact]
    public async Task CheckBenefitEligibilityAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new BenefitEligibility { Eligible = true, UsesRemaining = 5 });
        var resource = CreateResource(spy);

        await resource.CheckBenefitEligibilityAsync("mem_001", "unlimited_2d");

        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/subscriptions/members/mem_001/benefits/unlimited_2d/eligibility", spy.LastCall.Path);
    }

    [Fact]
    public async Task CheckBenefitEligibilityAsync_returns_eligible()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new BenefitEligibility { Eligible = true, UsesRemaining = 5 });
        var resource = CreateResource(spy);

        var result = await resource.CheckBenefitEligibilityAsync("mem_001", "unlimited_2d");

        Assert.True(result.Eligible);
        Assert.Equal(5, result.UsesRemaining);
    }

    [Fact]
    public async Task CheckBenefitEligibilityAsync_returns_ineligible_with_reason()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new BenefitEligibility
        {
            Eligible = false,
            UsesRemaining = 0,
            Reason = "Monthly limit reached",
        });
        var resource = CreateResource(spy);

        var result = await resource.CheckBenefitEligibilityAsync("mem_001", "imax");

        Assert.False(result.Eligible);
        Assert.Equal(0, result.UsesRemaining);
        Assert.Equal("Monthly limit reached", result.Reason);
    }

    [Fact]
    public async Task SuspendAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateMemberSubscription(status: "suspended"));
        var resource = CreateResource(spy);

        await resource.SuspendAsync("mem_001");

        Assert.Equal("POST", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/subscriptions/members/mem_001/suspend", spy.LastCall.Path);
    }

    [Fact]
    public async Task SuspendAsync_sends_input()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateMemberSubscription(status: "suspended"));
        var resource = CreateResource(spy);

        await resource.SuspendAsync("mem_001", new SuspendSubscriptionInput
        {
            ResumeDate = "2026-06-01",
            Reason = "Travelling",
        });

        Assert.NotNull(spy.LastCall.Body);
    }

    [Fact]
    public async Task SuspendAsync_returns_suspended_status()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateMemberSubscription(status: "suspended"));
        var resource = CreateResource(spy);

        var result = await resource.SuspendAsync("mem_001");

        Assert.Equal("suspended", result.Status);
    }

    [Fact]
    public async Task CancelAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateMemberSubscription(status: "cancelled"));
        var resource = CreateResource(spy);

        await resource.CancelAsync("mem_001");

        Assert.Equal("POST", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/subscriptions/members/mem_001/cancel", spy.LastCall.Path);
    }

    [Fact]
    public async Task CancelAsync_sends_input()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateMemberSubscription(status: "cancelled"));
        var resource = CreateResource(spy);

        await resource.CancelAsync("mem_001", new CancelSubscriptionInput
        {
            Immediate = true,
            Reason = "Too expensive",
        });

        Assert.NotNull(spy.LastCall.Body);
    }

    [Fact]
    public async Task CancelAsync_returns_cancelled_status()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateMemberSubscription(status: "cancelled"));
        var resource = CreateResource(spy);

        var result = await resource.CancelAsync("mem_001");

        Assert.Equal("cancelled", result.Status);
    }

    [Fact]
    public async Task GetMemberSubscriptionAsync_propagates_not_found()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueError(new NotFoundException("Subscription", "mem_nonexistent"));
        var resource = CreateResource(spy);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            resource.GetMemberSubscriptionAsync("mem_nonexistent"));
    }
}
