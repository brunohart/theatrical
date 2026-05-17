namespace Theatrical.Sdk.Types;

public sealed record LoyaltyMember
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public string? Tier { get; init; }
    public int Points { get; init; }
    public int? PointsBalance { get; init; }
    public string? Email { get; init; }
    public string? JoinedAt { get; init; }
    public string? MemberSince { get; init; }
}

public static class LoyaltyTiers
{
    public const string Bronze = "Bronze";
    public const string Silver = "Silver";
    public const string Gold = "Gold";
    public const string Platinum = "Platinum";
}

public sealed record PointsBalance
{
    public int Points { get; init; }
    public int LifetimePoints { get; init; }
}

public sealed record PointsTransaction
{
    public required string Id { get; init; }
    public required string Type { get; init; }
    public required int Points { get; init; }
    public string? Description { get; init; }
    public string? OrderId { get; init; }
    public string? CreatedAt { get; init; }
}

public sealed record RedemptionOption
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required int PointsCost { get; init; }
    public string? Description { get; init; }
    public string? Category { get; init; }
}

public sealed record RedeemPointsInput
{
    public required string OptionId { get; init; }
    public string? OrderId { get; init; }
    public int Quantity { get; init; } = 1;
}

public sealed record PointsHistoryFilter
{
    public string? Type { get; init; }
    public string? Since { get; init; }
    public string? Until { get; init; }
    public int? Limit { get; init; }
    public string? Cursor { get; init; }
}
