using System.Text.Json;
using System.Text.RegularExpressions;
using Theatrical.Sdk.Errors;
using Theatrical.Sdk.Http;

namespace Theatrical.Sdk.Mock;

internal sealed class MockHttpAdapter : ITheatricalHttpClient
{
    private readonly Dictionary<string, JsonElement> _responses;
    private readonly List<(Regex Pattern, JsonElement Response)> _patternResponses;

    public MockHttpAdapter(Dictionary<string, JsonElement>? overrides = null)
    {
        _responses = new Dictionary<string, JsonElement>(DefaultFixtures.All);
        if (overrides is not null)
        {
            foreach (var (key, value) in overrides)
                _responses[key] = value;
        }

        _patternResponses = _responses
            .Where(kv => kv.Key.Contains(":id"))
            .Select(kv => (
                Pattern: new Regex("^" + Regex.Escape(kv.Key).Replace(":id", "[^/]+") + "$"),
                Response: kv.Value))
            .ToList();
    }

    public Task<T> GetAsync<T>(string path, Dictionary<string, string>? queryParams = null, CancellationToken cancellationToken = default)
    {
        var data = Lookup(path);
        if (data is null)
            throw new NotFoundException($"Mock: no fixture for GET {path}", path.Split('/').LastOrDefault() ?? path);
        return Task.FromResult(data.Value.Deserialize<T>(JsonDefaults.Options)!);
    }

    public Task<T> PostAsync<T>(string path, object? body = null, CancellationToken cancellationToken = default)
    {
        var data = Lookup(path);
        if (data is not null)
            return Task.FromResult(data.Value.Deserialize<T>(JsonDefaults.Options)!);

        if (path.Contains("/orders"))
        {
            var order = JsonSerializer.SerializeToElement(new
            {
                id = $"ord_mock_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                sessionId = "ses_mock",
                status = "draft",
                tickets = Array.Empty<object>(),
                items = Array.Empty<object>(),
                subtotal = 0m,
                tax = 0m,
                discount = 0m,
                total = 0m,
                currency = "NZD",
                createdAt = DateTimeOffset.UtcNow.ToString("o"),
                updatedAt = DateTimeOffset.UtcNow.ToString("o"),
            }, JsonDefaults.Options);
            return Task.FromResult(order.Deserialize<T>(JsonDefaults.Options)!);
        }

        if (path.Contains("/subscriptions/members/"))
        {
            var memberId = ExtractIdFromPath(path, "/subscriptions/members/");
            var sub = JsonSerializer.SerializeToElement(new
            {
                memberId,
                planId = "plan_mock",
                status = path.Contains("/suspend") ? "paused" : path.Contains("/cancel") ? "cancelled" : "active",
            }, JsonDefaults.Options);
            return Task.FromResult(sub.Deserialize<T>(JsonDefaults.Options)!);
        }

        if (path.Contains("/loyalty/"))
        {
            var member = JsonSerializer.SerializeToElement(new
            {
                id = "mem_mock",
                name = "Mock Member",
                tier = "Bronze",
                points = 0,
            }, JsonDefaults.Options);
            return Task.FromResult(member.Deserialize<T>(JsonDefaults.Options)!);
        }

        return Task.FromResult(JsonSerializer.SerializeToElement(new { }, JsonDefaults.Options).Deserialize<T>(JsonDefaults.Options)!);
    }

    public Task<T> PutAsync<T>(string path, object? body = null, CancellationToken cancellationToken = default)
    {
        var data = Lookup(path);
        if (data is not null)
            return Task.FromResult(data.Value.Deserialize<T>(JsonDefaults.Options)!);
        return Task.FromResult(JsonSerializer.SerializeToElement(new { }, JsonDefaults.Options).Deserialize<T>(JsonDefaults.Options)!);
    }

    public Task<T> DeleteAsync<T>(string path, CancellationToken cancellationToken = default)
        => Task.FromResult(JsonSerializer.SerializeToElement(new { }, JsonDefaults.Options).Deserialize<T>(JsonDefaults.Options)!);

    private static string ExtractIdFromPath(string path, string prefix)
    {
        var idx = path.IndexOf(prefix, StringComparison.Ordinal);
        if (idx < 0) return "unknown";
        var rest = path[(idx + prefix.Length)..];
        var slashIdx = rest.IndexOf('/');
        return slashIdx >= 0 ? rest[..slashIdx] : rest;
    }

    private JsonElement? Lookup(string path)
    {
        var cleanPath = path.Split('?')[0];

        if (_responses.TryGetValue(cleanPath, out var exact))
            return exact;

        foreach (var (pattern, response) in _patternResponses)
        {
            if (pattern.IsMatch(cleanPath))
                return response;
        }

        return null;
    }
}
