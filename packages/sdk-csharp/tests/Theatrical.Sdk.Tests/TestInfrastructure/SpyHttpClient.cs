using System.Text.Json;
using Theatrical.Sdk.Http;

namespace Theatrical.Sdk.Tests.TestInfrastructure;

public sealed record HttpCall(string Method, string Path, Dictionary<string, string>? QueryParams, object? Body);

public sealed class SpyHttpClient : ITheatricalHttpClient
{
    private readonly Queue<object> _responses = new();
    private readonly Queue<Exception> _errors = new();
    public List<HttpCall> Calls { get; } = [];

    public SpyHttpClient EnqueueResponse<T>(T response) where T : notnull
    {
        _responses.Enqueue(response);
        return this;
    }

    public SpyHttpClient EnqueueError(Exception error)
    {
        _errors.Enqueue(error);
        return this;
    }

    public HttpCall LastCall => Calls[^1];

    public Task<T> GetAsync<T>(string path, Dictionary<string, string>? queryParams = null, CancellationToken cancellationToken = default)
    {
        Calls.Add(new HttpCall("GET", path, queryParams, null));
        return Resolve<T>();
    }

    public Task<T> PostAsync<T>(string path, object? body = null, CancellationToken cancellationToken = default)
    {
        Calls.Add(new HttpCall("POST", path, null, body));
        return Resolve<T>();
    }

    public Task<T> PutAsync<T>(string path, object? body = null, CancellationToken cancellationToken = default)
    {
        Calls.Add(new HttpCall("PUT", path, null, body));
        return Resolve<T>();
    }

    public Task<T> DeleteAsync<T>(string path, CancellationToken cancellationToken = default)
    {
        Calls.Add(new HttpCall("DELETE", path, null, null));
        return Resolve<T>();
    }

    private Task<T> Resolve<T>()
    {
        if (_errors.Count > 0)
            return Task.FromException<T>(_errors.Dequeue());

        if (_responses.Count > 0)
        {
            var raw = _responses.Dequeue();
            if (raw is T typed)
                return Task.FromResult(typed);

            var json = JsonSerializer.Serialize(raw, JsonDefaults.Options);
            return Task.FromResult(JsonSerializer.Deserialize<T>(json, JsonDefaults.Options)!);
        }

        return Task.FromResult(default(T)!);
    }
}
