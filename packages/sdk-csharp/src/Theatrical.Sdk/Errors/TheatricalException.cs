using System.Text.Json;

namespace Theatrical.Sdk.Errors;

public class TheatricalException : Exception
{
    public int StatusCode { get; }
    public string? VistaErrorCode { get; }
    public string? RequestId { get; }

    public TheatricalException(string message, int statusCode, string? vistaErrorCode = null, string? requestId = null, Exception? innerException = null)
        : base(message, innerException)
    {
        StatusCode = statusCode;
        VistaErrorCode = vistaErrorCode;
        RequestId = requestId;
    }

    public string ToJson()
    {
        return JsonSerializer.Serialize(new
        {
            name = GetType().Name,
            message = Message,
            statusCode = StatusCode,
            vistaErrorCode = VistaErrorCode,
            requestId = RequestId,
        });
    }
}

public sealed class AuthenticationException : TheatricalException
{
    public AuthenticationException(string message = "Authentication failed", string? vistaErrorCode = null, string? requestId = null)
        : base(message, 401, vistaErrorCode, requestId) { }
}

public sealed class RateLimitException : TheatricalException
{
    public TimeSpan RetryAfter { get; }

    public RateLimitException(TimeSpan retryAfter, string? requestId = null)
        : base($"Rate limit exceeded. Retry after {retryAfter.TotalSeconds}s", 429, requestId: requestId)
    {
        RetryAfter = retryAfter;
    }
}

public sealed class ValidationException : TheatricalException
{
    public IReadOnlyDictionary<string, string> Fields { get; }

    public ValidationException(string message, IReadOnlyDictionary<string, string>? fields = null, string? requestId = null)
        : base(message, 400, requestId: requestId)
    {
        Fields = fields ?? new Dictionary<string, string>();
    }
}

public sealed class NotFoundException : TheatricalException
{
    public string Resource { get; }
    public string ResourceId { get; }

    public NotFoundException(string resource, string resourceId, string? requestId = null)
        : base($"{resource} '{resourceId}' not found", 404, requestId: requestId)
    {
        Resource = resource;
        ResourceId = resourceId;
    }
}

public sealed class ServerException : TheatricalException
{
    public ServerException(string message = "Internal server error", string? requestId = null)
        : base(message, 500, requestId: requestId) { }
}
