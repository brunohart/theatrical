using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace Theatrical.Sdk.Auth;

public sealed class GasToken
{
    [JsonPropertyName("access_token")]
    public required string AccessToken { get; init; }

    [JsonPropertyName("token_type")]
    public string TokenType { get; init; } = "Bearer";

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; init; } = 3600;

    [JsonIgnore]
    public long IssuedAt { get; init; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
}

internal interface IGasClient : IDisposable
{
    Task<GasToken> RequestTokenAsync(CancellationToken cancellationToken = default);
}

internal sealed class GasClient : IGasClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public GasClient(string apiKey, string authUrl = "https://auth.moviexchange.com")
    {
        _apiKey = apiKey;
        _httpClient = new HttpClient { BaseAddress = new Uri(authUrl) };
    }

    public async Task<GasToken> RequestTokenAsync(CancellationToken cancellationToken = default)
    {
        var payload = new { grant_type = "client_credentials", api_key = _apiKey };

        using var response = await _httpClient.PostAsJsonAsync("/oauth/token", payload, cancellationToken)
            .ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            var status = (int)response.StatusCode;
            throw new Errors.AuthenticationException(
                $"GAS authentication failed: {status} {response.ReasonPhrase}");
        }

        var token = await response.Content.ReadFromJsonAsync<GasToken>(cancellationToken)
            .ConfigureAwait(false);

        return token ?? throw new Errors.AuthenticationException("GAS returned null token");
    }

    public void Dispose() => _httpClient.Dispose();
}
