namespace Theatrical.Sdk.Types;

public sealed record Order
{
    public required string Id { get; init; }
    public required OrderStatus Status { get; init; }
    public required string SessionId { get; init; }
    public Ticket[]? Tickets { get; init; }
    public OrderItem[]? Items { get; init; }
    public decimal? Total { get; init; }
    public string? Currency { get; init; }
    public DateTimeOffset? CreatedAt { get; init; }
}

public enum OrderStatus
{
    Created,
    Confirmed,
    Cancelled,
    Completed,
    Refunded
}

public sealed record Ticket
{
    public required string Id { get; init; }
    public required string SeatId { get; init; }
    public required string TicketType { get; init; }
    public required decimal Price { get; init; }
}

public sealed record OrderItem
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required int Quantity { get; init; }
    public required decimal Price { get; init; }
}

public sealed record CreateOrderRequest
{
    public required string SessionId { get; init; }
    public required string[] SeatIds { get; init; }
    public string? TicketType { get; init; }
    public string? LoyaltyMemberId { get; init; }
}
