namespace Theatrical.Sdk.Resources;

public sealed class SessionsResource
{
    private readonly HttpClient _httpClient;
    private readonly TheatricalClientOptions _options;

    internal SessionsResource(HttpClient httpClient, TheatricalClientOptions options)
    {
        _httpClient = httpClient;
        _options = options;
    }

    public Task<Types.Session[]> ListAsync(string siteId, DateOnly? date = null, string? filmId = null, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }

    public Task<Types.Session> GetAsync(string id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }

    public Task<Types.SeatAvailability> GetAvailabilityAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }
}
