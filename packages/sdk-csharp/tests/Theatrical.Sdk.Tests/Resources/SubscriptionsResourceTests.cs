using Xunit;
using Theatrical.Sdk.Types;

namespace Theatrical.Sdk.Tests.Resources;

public sealed class SubscriptionsResourceTests : IDisposable
{
    private readonly TheatricalClient _client = TheatricalClient.CreateMock();

    [Fact]
    public async Task ListPlansAsync_returns_plans()
    {
        var plans = await _client.Subscriptions.ListPlansAsync();

        Assert.NotNull(plans);
        Assert.Equal(2, plans.Length);
        Assert.Equal("plan_cinephile", plans[0].Id);
        Assert.Equal("Cinephile Pass", plans[0].Name);
        Assert.Equal(29.99m, plans[0].PricePerMonth);
    }

    [Fact]
    public async Task GetMemberSubscriptionAsync_returns_subscription()
    {
        var sub = await _client.Subscriptions.GetMemberSubscriptionAsync("mem_hobbiton_jane");

        Assert.NotNull(sub);
        Assert.Equal("mem_hobbiton_jane", sub.MemberId);
        Assert.Equal("plan_cinephile", sub.PlanId);
        Assert.Equal("active", sub.Status);
    }

    [Fact]
    public async Task GetUsageAsync_returns_usage()
    {
        var usage = await _client.Subscriptions.GetUsageAsync("mem_hobbiton_jane");

        Assert.NotNull(usage);
        Assert.Equal("mem_hobbiton_jane", usage.MemberId);
        Assert.Equal(2, usage.BookingsUsed);
        Assert.Equal(2, usage.BookingsRemaining);
        Assert.NotNull(usage.Benefits);
        Assert.Equal(2, usage.Benefits.Length);
    }

    [Fact]
    public async Task CheckBenefitEligibilityAsync_returns_eligibility()
    {
        var eligibility = await _client.Subscriptions.CheckBenefitEligibilityAsync("mem_hobbiton_jane", "benefit_tickets");

        Assert.NotNull(eligibility);
        Assert.True(eligibility.Eligible);
        Assert.Equal(2, eligibility.UsesRemaining);
    }

    [Fact]
    public async Task SuspendAsync_posts_suspend()
    {
        var sub = await _client.Subscriptions.SuspendAsync("mem_hobbiton_jane", new SuspendSubscriptionInput { Reason = "Travelling" });

        Assert.NotNull(sub);
    }

    [Fact]
    public async Task CancelAsync_posts_cancel()
    {
        var sub = await _client.Subscriptions.CancelAsync("mem_hobbiton_jane", new CancelSubscriptionInput { Immediate = false });

        Assert.NotNull(sub);
    }

    public void Dispose() => _client.Dispose();
}
