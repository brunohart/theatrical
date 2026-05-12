namespace Theatrical.Sdk.Types;

public sealed record SubscriptionPlan
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required decimal PricePerMonth { get; init; }
    public string? Description { get; init; }
    public string[]? Benefits { get; init; }
}

public sealed record MemberSubscription
{
    public required string MemberId { get; init; }
    public required string PlanId { get; init; }
    public required string Status { get; init; }
    public DateOnly? StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
}
