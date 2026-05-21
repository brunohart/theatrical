using Xunit;
using Theatrical.Sdk.Resources;
using Theatrical.Sdk.Types;
using Theatrical.Sdk.Errors;
using Theatrical.Sdk.Tests.TestInfrastructure;

namespace Theatrical.Sdk.Tests.Resources;

public sealed class PricingResourceSpyTests
{
    private static PricingResource CreateResource(SpyHttpClient spy)
        => new(spy);

    private static TicketType CreateTicketType(
        string? id = null,
        string? name = null,
        decimal price = 19.50m,
        bool isAvailable = true)
    {
        return new TicketType
        {
            Id = id ?? "tt_adult",
            Name = name ?? "Adult",
            Price = price,
            Description = "Standard adult ticket",
            Category = "standard",
            IsAvailable = isAvailable,
        };
    }

    private static PriceCalculation CreateCalculation(
        decimal subtotal = 39.00m,
        decimal tax = 5.22m,
        decimal total = 44.22m,
        decimal discount = 0m)
    {
        return new PriceCalculation
        {
            Subtotal = subtotal,
            Tax = tax,
            Total = total,
            Discount = discount,
            Currency = "NZD",
            Breakdown =
            [
                new PriceBreakdownItem { Label = "Adult x 2", Amount = 39.00m, Type = "ticket" },
                new PriceBreakdownItem { Label = "GST", Amount = 5.22m, Type = "tax" },
            ],
        };
    }

    [Fact]
    public async Task GetTicketTypesAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateTicketType() });
        var resource = CreateResource(spy);

        await resource.GetTicketTypesAsync("ses_001");

        Assert.Single(spy.Calls);
        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/sessions/ses_001/ticket-types", spy.LastCall.Path);
    }

    [Fact]
    public async Task GetTicketTypesAsync_passes_category_filter()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateTicketType() });
        var resource = CreateResource(spy);

        await resource.GetTicketTypesAsync("ses_001", new TicketTypeFilter { Category = "standard" });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("standard", spy.LastCall.QueryParams["category"]);
    }

    [Fact]
    public async Task GetTicketTypesAsync_passes_availableOnly_flag()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateTicketType() });
        var resource = CreateResource(spy);

        await resource.GetTicketTypesAsync("ses_001", new TicketTypeFilter { AvailableOnly = true });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("true", spy.LastCall.QueryParams["availableOnly"]);
    }

    [Fact]
    public async Task GetTicketTypesAsync_sends_no_params_without_filter()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateTicketType() });
        var resource = CreateResource(spy);

        await resource.GetTicketTypesAsync("ses_001");

        Assert.Null(spy.LastCall.QueryParams);
    }

    [Fact]
    public async Task GetTicketTypesAsync_returns_multiple_types()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[]
        {
            CreateTicketType(id: "tt_adult", name: "Adult", price: 19.50m),
            CreateTicketType(id: "tt_child", name: "Child", price: 12.00m),
            CreateTicketType(id: "tt_senior", name: "Senior", price: 14.00m),
        });
        var resource = CreateResource(spy);

        var result = await resource.GetTicketTypesAsync("ses_001");

        Assert.Equal(3, result.Length);
        Assert.Equal("Adult", result[0].Name);
        Assert.Equal(12.00m, result[1].Price);
        Assert.Equal("tt_senior", result[2].Id);
    }

    [Fact]
    public async Task GetTicketTypesAsync_returns_availability_status()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[]
        {
            CreateTicketType(isAvailable: true),
            CreateTicketType(id: "tt_vip", name: "VIP", isAvailable: false),
        });
        var resource = CreateResource(spy);

        var result = await resource.GetTicketTypesAsync("ses_001");

        Assert.True(result[0].IsAvailable);
        Assert.False(result[1].IsAvailable);
    }

    [Fact]
    public async Task CalculateAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateCalculation());
        var resource = CreateResource(spy);

        await resource.CalculateAsync("ses_001", "tt_adult", 2);

        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/pricing/calculate", spy.LastCall.Path);
    }

    [Fact]
    public async Task CalculateAsync_passes_query_params()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateCalculation());
        var resource = CreateResource(spy);

        await resource.CalculateAsync("ses_001", "tt_adult", 2);

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("ses_001", spy.LastCall.QueryParams["sessionId"]);
        Assert.Equal("tt_adult", spy.LastCall.QueryParams["ticketTypeId"]);
        Assert.Equal("2", spy.LastCall.QueryParams["quantity"]);
    }

    [Fact]
    public async Task CalculateAsync_defaults_quantity_to_one()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateCalculation(subtotal: 19.50m, tax: 2.61m, total: 22.11m));
        var resource = CreateResource(spy);

        await resource.CalculateAsync("ses_001", "tt_adult");

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("1", spy.LastCall.QueryParams["quantity"]);
    }

    [Fact]
    public async Task CalculateAsync_returns_price_breakdown()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateCalculation());
        var resource = CreateResource(spy);

        var result = await resource.CalculateAsync("ses_001", "tt_adult", 2);

        Assert.Equal(39.00m, result.Subtotal);
        Assert.Equal(5.22m, result.Tax);
        Assert.Equal(44.22m, result.Total);
        Assert.Equal("NZD", result.Currency);
        Assert.NotNull(result.Breakdown);
        Assert.Equal(2, result.Breakdown.Length);
    }

    [Fact]
    public async Task CalculateAsync_returns_discount()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateCalculation(subtotal: 39.00m, tax: 4.70m, total: 39.70m, discount: 5.00m));
        var resource = CreateResource(spy);

        var result = await resource.CalculateAsync("ses_001", "tt_adult", 2);

        Assert.Equal(5.00m, result.Discount);
    }

    [Fact]
    public async Task ApplyCouponsAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new CouponApplicationResult
        {
            Pricing = CreateCalculation(discount: 10.00m),
            Applied = [new AppliedCoupon { Code = "SAVE10", Discount = 10.00m, Description = "Save $10" }],
        });
        var resource = CreateResource(spy);

        await resource.ApplyCouponsAsync(new ApplyCouponsInput
        {
            SessionId = "ses_001",
            TicketTypeId = "tt_adult",
            Quantity = 2,
            CouponCodes = ["SAVE10"],
        });

        Assert.Equal("POST", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/pricing/apply-coupons", spy.LastCall.Path);
    }

    [Fact]
    public async Task ApplyCouponsAsync_sends_input_body()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new CouponApplicationResult
        {
            Pricing = CreateCalculation(),
        });
        var resource = CreateResource(spy);

        await resource.ApplyCouponsAsync(new ApplyCouponsInput
        {
            SessionId = "ses_001",
            TicketTypeId = "tt_adult",
            CouponCodes = ["CODE1", "CODE2"],
        });

        Assert.NotNull(spy.LastCall.Body);
    }

    [Fact]
    public async Task ApplyCouponsAsync_returns_applied_coupons()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new CouponApplicationResult
        {
            Pricing = CreateCalculation(discount: 10.00m),
            Applied = [new AppliedCoupon { Code = "SAVE10", Discount = 10.00m }],
            Rejected = [],
        });
        var resource = CreateResource(spy);

        var result = await resource.ApplyCouponsAsync(new ApplyCouponsInput
        {
            SessionId = "ses_001",
            TicketTypeId = "tt_adult",
            CouponCodes = ["SAVE10"],
        });

        Assert.NotNull(result.Applied);
        Assert.Single(result.Applied);
        Assert.Equal("SAVE10", result.Applied[0].Code);
        Assert.Equal(10.00m, result.Applied[0].Discount);
    }

    [Fact]
    public async Task ApplyCouponsAsync_returns_rejected_coupons()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new CouponApplicationResult
        {
            Pricing = CreateCalculation(),
            Applied = [],
            Rejected = [new RejectedCoupon { Code = "EXPIRED", Reason = "Coupon has expired" }],
        });
        var resource = CreateResource(spy);

        var result = await resource.ApplyCouponsAsync(new ApplyCouponsInput
        {
            SessionId = "ses_001",
            TicketTypeId = "tt_adult",
            CouponCodes = ["EXPIRED"],
        });

        Assert.NotNull(result.Rejected);
        Assert.Single(result.Rejected);
        Assert.Equal("EXPIRED", result.Rejected[0].Code);
        Assert.Contains("expired", result.Rejected[0].Reason, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetTicketTypesAsync_propagates_not_found_error()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueError(new NotFoundException("Session", "ses_nonexistent"));
        var resource = CreateResource(spy);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            resource.GetTicketTypesAsync("ses_nonexistent"));
    }

    [Fact]
    public async Task ApplyCouponsAsync_propagates_validation_error()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueError(new ValidationException("Invalid coupon code"));
        var resource = CreateResource(spy);

        await Assert.ThrowsAsync<ValidationException>(() =>
            resource.ApplyCouponsAsync(new ApplyCouponsInput
            {
                SessionId = "ses_001",
                TicketTypeId = "tt_adult",
                CouponCodes = [""],
            }));
    }
}
