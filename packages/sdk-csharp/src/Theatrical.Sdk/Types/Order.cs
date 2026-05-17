using System.Text.Json.Serialization;

namespace Theatrical.Sdk.Types;

public sealed record Order
{
    public required string Id { get; init; }
    public required string SessionId { get; init; }
    public required string Status { get; init; }
    public Ticket[]? Tickets { get; init; }
    public OrderItem[]? Items { get; init; }
    public decimal Subtotal { get; init; }
    public decimal Tax { get; init; }
    public decimal Discount { get; init; }
    public decimal Total { get; init; }
    public string? Currency { get; init; }
    public string? LoyaltyMemberId { get; init; }
    public int? LoyaltyPointsEarned { get; init; }
    public int? LoyaltyPointsRedeemed { get; init; }
    public string? CreatedAt { get; init; }
    public string? UpdatedAt { get; init; }
    public string? HeldAt { get; init; }
    public string? HeldUntil { get; init; }
    public string? ConfirmedAt { get; init; }
    public string? CompletedAt { get; init; }
    public string? CancelledAt { get; init; }
    public string? RefundedAt { get; init; }
}

public static class OrderStatuses
{
    public const string Draft = "draft";
    public const string Pending = "pending";
    public const string Held = "held";
    public const string Confirmed = "confirmed";
    public const string Completed = "completed";
    public const string Cancelled = "cancelled";
    public const string Refunded = "refunded";
}

public sealed record Ticket
{
    public required string Id { get; init; }
    public required string Type { get; init; }
    public required string SeatId { get; init; }
    public string? SeatLabel { get; init; }
    public required decimal Price { get; init; }
    public decimal? Discount { get; init; }
}

public sealed record OrderItem
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public string? Category { get; init; }
    public required int Quantity { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal TotalPrice { get; init; }
}

public sealed record CreateOrderRequest
{
    public required string SessionId { get; init; }
    public required TicketRequest[] Tickets { get; init; }
    public OrderItemRequest[]? Items { get; init; }
    public string? LoyaltyMemberId { get; init; }
}

public sealed record TicketRequest
{
    public required string Type { get; init; }
    public required string SeatId { get; init; }
}

public sealed record OrderItemRequest
{
    public required string MenuItemId { get; init; }
    public required int Quantity { get; init; }
}

public sealed record AddTicketsInput
{
    public required TicketRequest[] Tickets { get; init; }
}

public sealed record AddItemsInput
{
    public required OrderItemRequest[] Items { get; init; }
}

public sealed record ApplyLoyaltyInput
{
    public required string MemberId { get; init; }
    public int? PointsToRedeem { get; init; }
}

public sealed record OrderHistoryFilter
{
    public string? Status { get; init; }
    public string? Since { get; init; }
    public string? Until { get; init; }
    public int? Limit { get; init; }
    public string? Cursor { get; init; }
}
