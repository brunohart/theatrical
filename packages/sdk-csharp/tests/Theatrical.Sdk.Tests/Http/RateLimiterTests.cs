using Theatrical.Sdk.Http;
using Xunit;

namespace Theatrical.Sdk.Tests.Http;

public class RateLimiterTests
{
    [Fact]
    public async Task WaitForSlotAsync_UnderLimit_ResolvesImmediately()
    {
        var limiter = new RateLimiter(new RateLimiterConfig { MaxRequests = 10, Window = TimeSpan.FromMinutes(1) });

        var sw = System.Diagnostics.Stopwatch.StartNew();
        await limiter.WaitForSlotAsync();
        sw.Stop();

        Assert.True(sw.ElapsedMilliseconds < 50);
    }

    [Fact]
    public async Task WaitForSlotAsync_TracksActiveCount()
    {
        var limiter = new RateLimiter(new RateLimiterConfig { MaxRequests = 100, Window = TimeSpan.FromMinutes(1) });

        for (int i = 0; i < 5; i++)
            await limiter.WaitForSlotAsync();

        Assert.Equal(5, limiter.ActiveCount);
    }

    [Fact]
    public async Task Reset_ClearsAllTimestamps()
    {
        var limiter = new RateLimiter(new RateLimiterConfig { MaxRequests = 100, Window = TimeSpan.FromMinutes(1) });

        for (int i = 0; i < 5; i++)
            await limiter.WaitForSlotAsync();

        limiter.Reset();
        Assert.Equal(0, limiter.ActiveCount);
    }

    [Fact]
    public async Task WaitForSlotAsync_AtLimit_Blocks()
    {
        var limiter = new RateLimiter(new RateLimiterConfig { MaxRequests = 2, Window = TimeSpan.FromMilliseconds(100) });

        await limiter.WaitForSlotAsync();
        await limiter.WaitForSlotAsync();

        var sw = System.Diagnostics.Stopwatch.StartNew();
        await limiter.WaitForSlotAsync();
        sw.Stop();

        Assert.True(sw.ElapsedMilliseconds >= 50, $"Expected blocking, got {sw.ElapsedMilliseconds}ms");
    }

    [Fact]
    public void DefaultConfig_Has60RequestsPer60Seconds()
    {
        var config = RateLimiterConfig.Default;
        Assert.Equal(60, config.MaxRequests);
        Assert.Equal(TimeSpan.FromMinutes(1), config.Window);
    }
}
