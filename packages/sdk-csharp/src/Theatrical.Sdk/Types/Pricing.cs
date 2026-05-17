namespace Theatrical.Sdk.Types;

public sealed record TicketType
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required decimal Price { get; init; }
    public string? Description { get; init; }
    public string? Category { get; init; }
    public bool IsAvailable { get; init; } = true;
}

public sealed record TicketTypeFilter
{
    public string? Category { get; init; }
    public bool? AvailableOnly { get; init; }
}

public sealed record PriceCalculation
{
    public required decimal Subtotal { get; init; }
    public required decimal Tax { get; init; }
    public required decimal Total { get; init; }
    public decimal Discount { get; init; }
    public string? Currency { get; init; }
    public PriceBreakdownItem[]? Breakdown { get; init; }
}

public sealed record PriceBreakdownItem
{
    public required string Label { get; init; }
    public required decimal Amount { get; init; }
    public string? Type { get; init; }
}

public sealed record ApplyCouponsInput
{
    public required string SessionId { get; init; }
    public required string TicketTypeId { get; init; }
    public int Quantity { get; init; } = 1;
    public required string[] CouponCodes { get; init; }
    public string? MemberId { get; init; }
}

public sealed record CouponApplicationResult
{
    public required PriceCalculation Pricing { get; init; }
    public AppliedCoupon[]? Applied { get; init; }
    public RejectedCoupon[]? Rejected { get; init; }
}

public sealed record AppliedCoupon
{
    public required string Code { get; init; }
    public required decimal Discount { get; init; }
    public string? Description { get; init; }
}

public sealed record RejectedCoupon
{
    public required string Code { get; init; }
    public required string Reason { get; init; }
}
