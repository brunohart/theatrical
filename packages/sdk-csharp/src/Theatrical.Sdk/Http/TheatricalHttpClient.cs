using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Theatrical.Sdk.Auth;
using Theatrical.Sdk.Errors;

namespace Theatrical.Sdk.Http;

public interface ITheatricalHttpClient
{
    Task<T> GetAsync<T>(string path, Dictionary<string, string>? queryParams = null, CancellationToken cancellationToken = default);
    Task<T> PostAsync<T>(string path, object? body = null, CancellationToken cancellationToken = default);
    Task<T> PutAsync<T>(string path, object? body = null, CancellationToken cancellationToken = default);
    Task<T> DeleteAsync<T>(string path, CancellationToken cancellationToken = default);
}

internal sealed class TheatricalHttpClient : ITheatricalHttpClient, IDisposable
{
    private readonly HttpClient _httpClient;
    private readonly TokenManager _tokenManager;
    private readonly RateLimiter? _rateLimiter;
    private readonly RetryConfig _retryConfig;
    private readonly bool _debug;

    public TheatricalHttpClient(
        string baseUrl,
        TimeSpan timeout,
        TokenManager tokenManager,
        RetryConfig? retryConfig = null,
        RateLimiter? rateLimiter = null,
        bool debug = false)
    {
        _tokenManager = tokenManager;
        _retryConfig = retryConfig ?? RetryConfig.Default;
        _rateLimiter = rateLimiter;
        _debug = debug;

        _httpClient = new HttpClient
        {
            BaseAddress = new Uri(baseUrl),
            Timeout = timeout,
        };
        _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
    }

    public Task<T> GetAsync<T>(string path, Dictionary<string, string>? queryParams = null, CancellationToken cancellationToken = default)
    {
        var url = BuildUrl(path, queryParams);
        return SendAsync<T>(HttpMethod.Get, url, body: null, cancellationToken);
    }

    public Task<T> PostAsync<T>(string path, object? body = null, CancellationToken cancellationToken = default)
        => SendAsync<T>(HttpMethod.Post, path, body, cancellationToken);

    public Task<T> PutAsync<T>(string path, object? body = null, CancellationToken cancellationToken = default)
        => SendAsync<T>(HttpMethod.Put, path, body, cancellationToken);

    public Task<T> DeleteAsync<T>(string path, CancellationToken cancellationToken = default)
        => SendAsync<T>(HttpMethod.Delete, path, body: null, cancellationToken);

    private async Task<T> SendAsync<T>(HttpMethod method, string path, object? body, CancellationToken cancellationToken, int attempt = 1)
    {
        if (_rateLimiter is not null)
            await _rateLimiter.WaitForSlotAsync(cancellationToken).ConfigureAwait(false);

        var token = await _tokenManager.GetTokenAsync(cancellationToken).ConfigureAwait(false);
        var requestId = GenerateRequestId();

        if (_debug)
            Console.WriteLine($"[theatrical] {method} {path} ({requestId})");

        using var request = new HttpRequestMessage(method, path);
        request.Headers.Add("Authorization", $"Bearer {token}");
        request.Headers.Add("X-Request-ID", requestId);

        if (body is not null)
            request.Content = JsonContent.Create(body);

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new TheatricalException("Request timed out", 408, requestId: requestId);
        }
        catch (HttpRequestException ex)
        {
            throw new TheatricalException($"Network error: {ex.Message}", 0, requestId: requestId, innerException: ex);
        }

        if (response.IsSuccessStatusCode)
        {
            var result = await response.Content.ReadFromJsonAsync<T>(cancellationToken).ConfigureAwait(false);
            return result!;
        }

        if (response.StatusCode == HttpStatusCode.Unauthorized && attempt <= 1)
        {
            _tokenManager.Invalidate();
            return await SendAsync<T>(method, path, body, cancellationToken, attempt + 1).ConfigureAwait(false);
        }

        var error = await ErrorParser.ParseResponseAsync(response, $"{_httpClient.BaseAddress}{path}").ConfigureAwait(false);

        if ((error is RateLimitException rle || error is ServerException) && attempt <= _retryConfig.MaxRetries)
        {
            var delay = error is RateLimitException rateLimitEx
                ? rateLimitEx.RetryAfter
                : _retryConfig.ComputeBackoffDelay(attempt);
            await Task.Delay(delay, cancellationToken).ConfigureAwait(false);
            return await SendAsync<T>(method, path, body, cancellationToken, attempt + 1).ConfigureAwait(false);
        }

        throw error;
    }

    private static string BuildUrl(string path, Dictionary<string, string>? queryParams)
    {
        if (queryParams is null || queryParams.Count == 0)
            return path;

        var query = string.Join("&", queryParams
            .Where(kv => kv.Value is not null)
            .Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value)}"));

        return $"{path}?{query}";
    }

    private static string GenerateRequestId()
        => $"th_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Guid.NewGuid().ToString("N")[..7]}";

    public void Dispose() => _httpClient.Dispose();
}
