namespace Theatrical.Sdk.Auth;

internal sealed class TokenManager : IDisposable
{
    private readonly IGasClient _gasClient;
    private readonly SemaphoreSlim _semaphore = new(1, 1);
    private readonly TimeSpan _expiryBuffer = TimeSpan.FromMinutes(5);
    private GasToken? _currentToken;

    public TokenManager(IGasClient gasClient)
    {
        _gasClient = gasClient;
    }

    public async Task<string> GetTokenAsync(CancellationToken cancellationToken = default)
    {
        var token = _currentToken;
        if (token is not null && !IsExpired(token))
            return token.AccessToken;

        await _semaphore.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            token = _currentToken;
            if (token is not null && !IsExpired(token))
                return token.AccessToken;

            var newToken = await _gasClient.RequestTokenAsync(cancellationToken).ConfigureAwait(false);
            _currentToken = newToken;
            return newToken.AccessToken;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public void Invalidate() => _currentToken = null;

    private bool IsExpired(GasToken token)
    {
        var expiresAt = token.IssuedAt + token.ExpiresIn * 1000;
        return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() >= expiresAt - (long)_expiryBuffer.TotalMilliseconds;
    }

    public void Dispose() => _semaphore.Dispose();
}
