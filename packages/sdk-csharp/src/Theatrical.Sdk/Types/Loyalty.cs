namespace Theatrical.Sdk.Types;

public sealed record LoyaltyMember
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required LoyaltyTier Tier { get; init; }
    public required int Points { get; init; }
    public string? Email { get; init; }
    public DateOnly? MemberSince { get; init; }
}

public enum LoyaltyTier
{
    Bronze,
    Silver,
    Gold,
    Platinum
}

public sealed record PointsBalance
{
    public required string MemberId { get; init; }
    public required int Available { get; init; }
    public required int Pending { get; init; }
    public required int Lifetime { get; init; }
}
