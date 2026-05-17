using Theatrical.Sdk.Http;
using Theatrical.Sdk.Types;

namespace Theatrical.Sdk.Resources;

public sealed class SitesResource
{
    private readonly ITheatricalHttpClient _httpClient;

    internal SitesResource(ITheatricalHttpClient httpClient, TheatricalClientOptions options)
    {
        _httpClient = httpClient;
    }

    public async Task<Site[]> ListAsync(string? query = null, double? latitude = null, double? longitude = null, double? radiusKm = null, CancellationToken cancellationToken = default)
    {
        var queryParams = new Dictionary<string, string>();
        if (query is not null) queryParams["query"] = query;
        if (latitude is not null) queryParams["latitude"] = latitude.Value.ToString();
        if (longitude is not null) queryParams["longitude"] = longitude.Value.ToString();
        if (radiusKm is not null) queryParams["radius"] = radiusKm.Value.ToString();

        return await _httpClient.GetAsync<Site[]>("/ocapi/v1/sites", queryParams.Count > 0 ? queryParams : null, cancellationToken).ConfigureAwait(false);
    }

    public async Task<Site> GetAsync(string siteId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetAsync<Site>($"/ocapi/v1/sites/{siteId}", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<Screen[]> GetScreensAsync(string siteId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetAsync<Screen[]>($"/ocapi/v1/sites/{siteId}/screens", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<Site[]> NearbyAsync(double latitude, double longitude, double radiusKm, CancellationToken cancellationToken = default)
    {
        return await ListAsync(latitude: latitude, longitude: longitude, radiusKm: radiusKm, cancellationToken: cancellationToken).ConfigureAwait(false);
    }
}
