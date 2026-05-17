namespace Theatrical.Sdk.Extensions;

/// <summary>
/// Extension methods for HttpResponseMessage to simplify response handling.
/// </summary>
public static class HttpResponseExtensions
{
    /// <summary>
    /// Extract the X-Request-Id header from a Vista API response.
    /// </summary>
    public static string? GetRequestId(this HttpResponseMessage response)
    {
        return response.Headers.TryGetValues("X-Request-Id", out var values)
            ? values.FirstOrDefault()
            : null;
    }

    /// <summary>
    /// Extract the Retry-After header value in seconds.
    /// </summary>
    public static int? GetRetryAfterSeconds(this HttpResponseMessage response)
    {
        var retryAfter = response.Headers.RetryAfter;
        if (retryAfter?.Delta != null) return (int)retryAfter.Delta.Value.TotalSeconds;
        if (retryAfter?.Date != null) return (int)(retryAfter.Date.Value - DateTimeOffset.UtcNow).TotalSeconds;
        return null;
    }

    /// <summary>
    /// Check if the response indicates a transient error suitable for retry.
    /// </summary>
    public static bool IsTransientError(this HttpResponseMessage response)
    {
        var code = (int)response.StatusCode;
        return code == 429 || code >= 500;
    }
}
