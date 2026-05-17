using Xunit;
using Theatrical.Sdk.Types;

namespace Theatrical.Sdk.Tests.Resources;

public sealed class LoyaltyResourceTests : IDisposable
{
    private readonly TheatricalClient _client = TheatricalClient.CreateMock();

    [Fact]
    public async Task GetMemberAsync_returns_member()
    {
        var member = await _client.Loyalty.GetMemberAsync("mem_hobbiton_jane");

        Assert.NotNull(member);
        Assert.Equal("mem_hobbiton_jane", member.Id);
        Assert.Equal("Jane Smith", member.Name);
        Assert.Equal("jane@example.co.nz", member.Email);
        Assert.Equal(LoyaltyTiers.Gold, member.Tier);
        Assert.Equal(4200, member.Points);
    }

    [Fact]
    public async Task AuthenticateAsync_returns_member()
    {
        var member = await _client.Loyalty.AuthenticateAsync("jane@example.co.nz", "password123");

        Assert.NotNull(member);
        Assert.Equal("mem_hobbiton_jane", member.Id);
        Assert.Equal(LoyaltyTiers.Gold, member.Tier);
    }

    [Fact]
    public async Task GetPointsBalanceAsync_returns_balance()
    {
        var balance = await _client.Loyalty.GetPointsBalanceAsync("mem_hobbiton_jane");

        Assert.NotNull(balance);
        Assert.Equal(4200, balance.Points);
        Assert.Equal(12800, balance.LifetimePoints);
    }

    [Fact]
    public async Task GetHistoryAsync_returns_transactions()
    {
        var result = await _client.Loyalty.GetHistoryAsync("mem_hobbiton_jane");

        Assert.NotNull(result);
        Assert.Equal(2, result.Data.Length);
        Assert.Equal("earn", result.Data[0].Type);
        Assert.Equal(200, result.Data[0].Points);
    }

    [Fact]
    public async Task ListRedemptionOptionsAsync_returns_options()
    {
        var options = await _client.Loyalty.ListRedemptionOptionsAsync("mem_hobbiton_jane");

        Assert.NotNull(options);
        Assert.Equal(2, options.Length);
        Assert.Equal("Free Large Popcorn", options[0].Name);
        Assert.Equal(500, options[0].PointsCost);
    }

    public void Dispose() => _client.Dispose();
}
