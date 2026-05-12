namespace Theatrical.Sdk.Types;

public sealed record TicketType
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required decimal Price { get; init; }
    public string? Description { get; init; }
}

public sealed record PriceCalculation
{
    public required decimal Subtotal { get; init; }
    public required decimal Tax { get; init; }
    public required decimal Total { get; init; }
    public decimal? Discount { get; init; }
    public string? Currency { get; init; }
}

public sealed record PriceCalculationRequest
{
    public required string SessionId { get; init; }
    public required string TicketTypeId { get; init; }
    public required int Quantity { get; init; }
    public string? LoyaltyMemberId { get; init; }
    public string? PromoCode { get; init; }
}
