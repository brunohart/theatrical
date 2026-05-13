using Theatrical.Sdk.Auth;
using Xunit;

namespace Theatrical.Sdk.Tests.Auth;

public class TokenManagerTests : IDisposable
{
    private readonly TokenManager _tokenManager;
    private readonly FakeGasClient _gasClient;

    public TokenManagerTests()
    {
        _gasClient = new FakeGasClient();
        _tokenManager = new TokenManager(_gasClient);
    }

    [Fact]
    public async Task GetTokenAsync_FirstCall_RequestsNewToken()
    {
        var token = await _tokenManager.GetTokenAsync();
        Assert.Equal("fake-token-1", token);
        Assert.Equal(1, _gasClient.RequestCount);
    }

    [Fact]
    public async Task GetTokenAsync_SecondCall_ReturnsCachedToken()
    {
        await _tokenManager.GetTokenAsync();
        var token = await _tokenManager.GetTokenAsync();

        Assert.Equal("fake-token-1", token);
        Assert.Equal(1, _gasClient.RequestCount);
    }

    [Fact]
    public async Task GetTokenAsync_AfterInvalidate_RequestsNewToken()
    {
        await _tokenManager.GetTokenAsync();
        _tokenManager.Invalidate();
        var token = await _tokenManager.GetTokenAsync();

        Assert.Equal("fake-token-2", token);
        Assert.Equal(2, _gasClient.RequestCount);
    }

    [Fact]
    public async Task GetTokenAsync_ConcurrentCalls_DeduplicatesRequests()
    {
        var tasks = Enumerable.Range(0, 10)
            .Select(_ => _tokenManager.GetTokenAsync())
            .ToArray();

        var tokens = await Task.WhenAll(tasks);

        Assert.All(tokens, t => Assert.Equal("fake-token-1", t));
        Assert.Equal(1, _gasClient.RequestCount);
    }

    public void Dispose() => _tokenManager.Dispose();
}

internal class FakeGasClient : IGasClient
{
    public int RequestCount { get; private set; }

    public Task<GasToken> RequestTokenAsync(CancellationToken cancellationToken = default)
    {
        RequestCount++;
        return Task.FromResult(new GasToken
        {
            AccessToken = $"fake-token-{RequestCount}",
            TokenType = "Bearer",
            ExpiresIn = 3600,
            IssuedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
        });
    }

    public void Dispose() { }
}
