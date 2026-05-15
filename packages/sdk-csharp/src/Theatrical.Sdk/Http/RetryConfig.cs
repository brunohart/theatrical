namespace Theatrical.Sdk.Http;

public sealed class RetryConfig
{
    public int MaxRetries { get; init; } = 3;
    public TimeSpan BaseDelay { get; init; } = TimeSpan.FromSeconds(1);
    public TimeSpan MaxDelay { get; init; } = TimeSpan.FromSeconds(30);
    public bool Jitter { get; init; } = true;

    public static RetryConfig Default { get; } = new();

    internal TimeSpan ComputeBackoffDelay(int attempt)
    {
        var exponentialMs = Math.Min(
            BaseDelay.TotalMilliseconds * Math.Pow(2, attempt - 1),
            MaxDelay.TotalMilliseconds);

        if (!Jitter)
            return TimeSpan.FromMilliseconds(exponentialMs);

        var jittered = exponentialMs * (0.5 + Random.Shared.NextDouble() * 0.5);
        return TimeSpan.FromMilliseconds(jittered);
    }
}
