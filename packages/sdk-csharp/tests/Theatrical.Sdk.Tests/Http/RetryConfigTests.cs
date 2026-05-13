using Theatrical.Sdk.Http;
using Xunit;

namespace Theatrical.Sdk.Tests.Http;

public class RetryConfigTests
{
    [Fact]
    public void Default_HasExpectedValues()
    {
        var config = RetryConfig.Default;

        Assert.Equal(3, config.MaxRetries);
        Assert.Equal(TimeSpan.FromSeconds(1), config.BaseDelay);
        Assert.Equal(TimeSpan.FromSeconds(30), config.MaxDelay);
        Assert.True(config.Jitter);
    }

    [Fact]
    public void ComputeBackoffDelay_WithoutJitter_ReturnsExponential()
    {
        var config = new RetryConfig { BaseDelay = TimeSpan.FromSeconds(1), Jitter = false };

        var delay1 = config.ComputeBackoffDelay(1);
        var delay2 = config.ComputeBackoffDelay(2);
        var delay3 = config.ComputeBackoffDelay(3);

        Assert.Equal(TimeSpan.FromSeconds(1), delay1);
        Assert.Equal(TimeSpan.FromSeconds(2), delay2);
        Assert.Equal(TimeSpan.FromSeconds(4), delay3);
    }

    [Fact]
    public void ComputeBackoffDelay_WithJitter_ReturnsBoundedValue()
    {
        var config = new RetryConfig { BaseDelay = TimeSpan.FromSeconds(1), Jitter = true };

        for (int i = 0; i < 50; i++)
        {
            var delay = config.ComputeBackoffDelay(1);
            Assert.InRange(delay.TotalMilliseconds, 500, 1000);
        }
    }

    [Fact]
    public void ComputeBackoffDelay_RespectsMaxDelay()
    {
        var config = new RetryConfig
        {
            BaseDelay = TimeSpan.FromSeconds(1),
            MaxDelay = TimeSpan.FromSeconds(5),
            Jitter = false,
        };

        var delay = config.ComputeBackoffDelay(10);
        Assert.Equal(TimeSpan.FromSeconds(5), delay);
    }
}
