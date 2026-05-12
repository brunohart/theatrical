namespace Theatrical.Sdk.Resources;

public sealed class SitesResource
{
    private readonly HttpClient _httpClient;
    private readonly TheatricalClientOptions _options;

    internal SitesResource(HttpClient httpClient, TheatricalClientOptions options)
    {
        _httpClient = httpClient;
        _options = options;
    }

    public Task<Types.Site[]> ListAsync(string? query = null, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }

    public Task<Types.Site> GetAsync(string id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }

    public Task<Types.Screen[]> GetScreensAsync(string siteId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }
}
