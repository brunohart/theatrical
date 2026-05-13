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
        return Task.FromResult(data.Value.Deserialize<T>()!);
    }

    public Task<T> PostAsync<T>(string path, object? body = null, CancellationToken cancellationToken = default)
    {
        var data = Lookup(path);
        if (data is not null)
            return Task.FromResult(data.Value.Deserialize<T>()!);

        if (path.Contains("/orders"))
        {
            var order = JsonSerializer.SerializeToElement(new
            {
                id = $"ord_mock_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                status = "draft",
                tickets = Array.Empty<object>(),
                items = Array.Empty<object>(),
                pricing = new { subtotal = 0, tax = 0, discounts = 0, total = 0 },
                createdAt = DateTimeOffset.UtcNow.ToString("o"),
                updatedAt = DateTimeOffset.UtcNow.ToString("o"),
            });
            return Task.FromResult(order.Deserialize<T>()!);
        }

        return Task.FromResult(JsonSerializer.SerializeToElement(new { }).Deserialize<T>()!);
    }

    public Task<T> PutAsync<T>(string path, object? body = null, CancellationToken cancellationToken = default)
    {
        var data = Lookup(path);
        if (data is not null)
            return Task.FromResult(data.Value.Deserialize<T>()!);
        return Task.FromResult(JsonSerializer.SerializeToElement(new { }).Deserialize<T>()!);
    }

    public Task<T> DeleteAsync<T>(string path, CancellationToken cancellationToken = default)
        => Task.FromResult(JsonSerializer.SerializeToElement(new { }).Deserialize<T>()!);

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
