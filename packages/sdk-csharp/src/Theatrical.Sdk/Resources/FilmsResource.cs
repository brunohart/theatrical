namespace Theatrical.Sdk.Resources;

public sealed class FilmsResource
{
    private readonly HttpClient _httpClient;
    private readonly TheatricalClientOptions _options;

    internal FilmsResource(HttpClient httpClient, TheatricalClientOptions options)
    {
        _httpClient = httpClient;
        _options = options;
    }

    public Task<Types.Film[]> NowShowingAsync(string siteId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }

    public Task<Types.Film[]> ComingSoonAsync(string siteId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }

    public Task<Types.Film[]> SearchAsync(string query, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }
}
