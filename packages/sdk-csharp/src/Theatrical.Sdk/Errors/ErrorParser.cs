using System.Net;
using System.Text.Json;

namespace Theatrical.Sdk.Errors;

internal static class ErrorParser
{
    public static async Task<TheatricalException> ParseResponseAsync(
        HttpResponseMessage response, string? requestUrl = null)
    {
        var status = (int)response.StatusCode;
        var body = await TryParseBodyAsync(response).ConfigureAwait(false);

        string? vistaCode = null;
        string? message = null;
        string? requestId = null;
        Dictionary<string, string> fieldErrors = new();

        if (body is { } b)
        {
            if (b.TryGetProperty("code", out var codeProp))
                vistaCode = codeProp.GetString();
            if (b.TryGetProperty("message", out var msgProp))
                message = msgProp.GetString();
            if (b.TryGetProperty("requestId", out var reqIdProp))
                requestId = reqIdProp.GetString();
            if (b.TryGetProperty("errors", out var errorsProp) && errorsProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var err in errorsProp.EnumerateArray())
                {
                    var field = err.TryGetProperty("field", out var f) ? f.GetString() : null;
                    var msg = err.TryGetProperty("message", out var m) ? m.GetString() : null;
                    if (field is not null && msg is not null)
                        fieldErrors[field] = msg;
                }
            }
            if (vistaCode is null && b.TryGetProperty("fault", out var faultProp))
            {
                if (faultProp.TryGetProperty("type", out var typeProp))
                    vistaCode = typeProp.GetString();
                if (faultProp.TryGetProperty("message", out var faultMsgProp))
                    message = faultMsgProp.GetString();
            }
        }

        var resolvedMessage = VistaErrorCodes.ResolveMessage(
            vistaCode, message ?? $"Request failed with status {status}");

        if (status is 401 or 403)
            return new AuthenticationException(resolvedMessage, vistaCode, requestId);

        if (status == 429)
        {
            var retryAfter = ParseRetryAfter(response);
            return new RateLimitException(retryAfter, requestId);
        }

        if (status is 400 or 422)
            return new ValidationException(resolvedMessage, fieldErrors, requestId);

        if (status == 404)
        {
            var (resource, resourceId) = ExtractResource(vistaCode, requestUrl);
            return new NotFoundException(resource, resourceId, requestId);
        }

        if (status >= 500)
            return new ServerException(resolvedMessage, vistaCode, requestId);

        return new TheatricalException(resolvedMessage, status, vistaCode, requestId);
    }

    private static async Task<JsonElement?> TryParseBodyAsync(HttpResponseMessage response)
    {
        try
        {
            var text = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
            if (string.IsNullOrEmpty(text)) return null;
            using var doc = JsonDocument.Parse(text);
            return doc.RootElement.Clone();
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static TimeSpan ParseRetryAfter(HttpResponseMessage response)
    {
        if (!response.Headers.TryGetValues("Retry-After", out var values))
            return TimeSpan.FromSeconds(60);

        var raw = values.FirstOrDefault();
        if (raw is null) return TimeSpan.FromSeconds(60);

        if (int.TryParse(raw, out var seconds) && seconds >= 0)
            return TimeSpan.FromSeconds(seconds);

        if (DateTimeOffset.TryParse(raw, out var date))
        {
            var delta = date - DateTimeOffset.UtcNow;
            return delta > TimeSpan.Zero ? delta : TimeSpan.Zero;
        }

        return TimeSpan.FromSeconds(60);
    }

    private static readonly Dictionary<string, string> CodeToResource = new()
    {
        ["SESSION_NOT_FOUND"] = "Session",
        ["FILM_NOT_FOUND"] = "Film",
        ["SITE_NOT_FOUND"] = "Site",
        ["ORDER_NOT_FOUND"] = "Order",
        ["MEMBER_NOT_FOUND"] = "Member",
    };

    private static (string Resource, string ResourceId) ExtractResource(
        string? vistaCode, string? requestUrl)
    {
        var resource = vistaCode is not null && CodeToResource.TryGetValue(vistaCode, out var r)
            ? r
            : InferResourceFromUrl(requestUrl);

        var id = "unknown";
        if (requestUrl is not null && Uri.TryCreate(requestUrl, UriKind.Absolute, out var uri))
        {
            var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (segments.Length > 0)
                id = segments[^1];
        }

        return (resource, id);
    }

    private static string InferResourceFromUrl(string? url)
    {
        if (url is null) return "Resource";
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)) return "Resource";

        var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length >= 2)
        {
            var noun = segments[^2];
            if (noun.Length > 1 && noun.EndsWith('s'))
                return char.ToUpper(noun[0]) + noun[1..^1];
        }

        return "Resource";
    }
}
