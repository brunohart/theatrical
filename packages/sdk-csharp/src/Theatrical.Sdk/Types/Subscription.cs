namespace Theatrical.Sdk.Types;

public sealed record SubscriptionPlan
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required decimal PricePerMonth { get; init; }
    public string? Description { get; init; }
    public string[]? Benefits { get; init; }
    public bool IsAvailable { get; init; } = true;
}

public sealed record MemberSubscription
{
    public required string MemberId { get; init; }
    public required string PlanId { get; init; }
    public required string Status { get; init; }
    public string? StartDate { get; init; }
    public string? EndDate { get; init; }
    public string? NextBillingDate { get; init; }
}

public sealed record SubscriptionUsage
{
    public required string MemberId { get; init; }
    public required string PlanId { get; init; }
    public int BookingsUsed { get; init; }
    public int? BookingsRemaining { get; init; }
    public string? PeriodStart { get; init; }
    public string? PeriodEnd { get; init; }
    public BenefitUsage[]? Benefits { get; init; }
}

public sealed record BenefitUsage
{
    public required string BenefitId { get; init; }
    public required string Name { get; init; }
    public int Used { get; init; }
    public int? Limit { get; init; }
}

public sealed record BenefitEligibility
{
    public bool Eligible { get; init; }
    public int? UsesRemaining { get; init; }
    public string? Reason { get; init; }
}

public sealed record SuspendSubscriptionInput
{
    public string? ResumeDate { get; init; }
    public string? Reason { get; init; }
}

public sealed record CancelSubscriptionInput
{
    public bool Immediate { get; init; }
    public string? Reason { get; init; }
}
