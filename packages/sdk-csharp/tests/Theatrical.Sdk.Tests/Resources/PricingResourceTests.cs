using Xunit;
using Theatrical.Sdk.Types;

namespace Theatrical.Sdk.Tests.Resources;

public sealed class PricingResourceTests : IDisposable
{
    private readonly TheatricalClient _client = TheatricalClient.CreateMock();

    [Fact]
    public async Task GetTicketTypesAsync_returns_types()
    {
        var types = await _client.Pricing.GetTicketTypesAsync("ses_roxy_holdovers_20260427_1915");

        Assert.NotNull(types);
        Assert.Equal(3, types.Length);
        Assert.Equal("tt_adult", types[0].Id);
        Assert.Equal("Adult", types[0].Name);
        Assert.Equal(19.50m, types[0].Price);
    }

    [Fact]
    public async Task CalculateAsync_returns_price_calculation()
    {
        var calc = await _client.Pricing.CalculateAsync("ses_roxy_holdovers_20260427_1915", "tt_adult", 2);

        Assert.NotNull(calc);
        Assert.Equal(39.00m, calc.Subtotal);
        Assert.Equal(5.85m, calc.Tax);
        Assert.Equal(44.85m, calc.Total);
        Assert.Equal("NZD", calc.Currency);
        Assert.NotNull(calc.Breakdown);
        Assert.Equal(2, calc.Breakdown.Length);
    }

    [Fact]
    public async Task ApplyCouponsAsync_returns_coupon_result()
    {
        var result = await _client.Pricing.ApplyCouponsAsync(new ApplyCouponsInput
        {
            SessionId = "ses_roxy_holdovers_20260427_1915",
            TicketTypeId = "tt_adult",
            Quantity = 2,
            CouponCodes = ["WELCOME5"],
        });

        Assert.NotNull(result);
        Assert.NotNull(result.Pricing);
        Assert.Equal(5.00m, result.Pricing.Discount);
        Assert.NotNull(result.Applied);
        Assert.Single(result.Applied);
        Assert.Equal("WELCOME5", result.Applied[0].Code);
    }

    public void Dispose() => _client.Dispose();
}
