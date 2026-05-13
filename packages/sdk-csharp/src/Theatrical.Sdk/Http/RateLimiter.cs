namespace Theatrical.Sdk.Http;

public sealed class RateLimiterConfig
{
    public int MaxRequests { get; init; } = 60;
    public TimeSpan Window { get; init; } = TimeSpan.FromMinutes(1);

    public static RateLimiterConfig Default { get; } = new();
}

public sealed class RateLimiter
{
    private readonly RateLimiterConfig _config;
    private readonly Queue<long> _timestamps = new();
    private readonly object _lock = new();

    public RateLimiter(RateLimiterConfig? config = null)
    {
        _config = config ?? RateLimiterConfig.Default;
    }

    public async Task WaitForSlotAsync(CancellationToken cancellationToken = default)
    {
        while (true)
        {
            cancellationToken.ThrowIfCancellationRequested();

            TimeSpan? waitTime;
            lock (_lock)
            {
                var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                var windowStart = now - (long)_config.Window.TotalMilliseconds;

                while (_timestamps.Count > 0 && _timestamps.Peek() < windowStart)
                    _timestamps.Dequeue();

                if (_timestamps.Count < _config.MaxRequests)
                {
                    _timestamps.Enqueue(now);
                    return;
                }

                var oldestTs = _timestamps.Peek();
                var waitMs = oldestTs + (long)_config.Window.TotalMilliseconds - now + 1;
                waitTime = TimeSpan.FromMilliseconds(waitMs);
            }

            await Task.Delay(waitTime.Value, cancellationToken).ConfigureAwait(false);
        }
    }

    public int ActiveCount
    {
        get
        {
            lock (_lock)
            {
                var windowStart = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - (long)_config.Window.TotalMilliseconds;
                return _timestamps.Count(ts => ts >= windowStart);
            }
        }
    }

    public void Reset()
    {
        lock (_lock)
        {
            _timestamps.Clear();
        }
    }
}
