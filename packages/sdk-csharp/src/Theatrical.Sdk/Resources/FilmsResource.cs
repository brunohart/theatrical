using Theatrical.Sdk.Http;
using Theatrical.Sdk.Types;

namespace Theatrical.Sdk.Resources;

public sealed class FilmsResource
{
    private readonly ITheatricalHttpClient _httpClient;

    internal FilmsResource(ITheatricalHttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<Film[]> NowShowingAsync(string? siteId = null, CancellationToken cancellationToken = default)
    {
        var queryParams = siteId is not null ? new Dictionary<string, string> { ["siteId"] = siteId } : null;
        return await _httpClient.GetAsync<Film[]>("/ocapi/v1/films/now-showing", queryParams, cancellationToken).ConfigureAwait(false);
    }

    public async Task<Film[]> ComingSoonAsync(string? siteId = null, CancellationToken cancellationToken = default)
    {
        var queryParams = siteId is not null ? new Dictionary<string, string> { ["siteId"] = siteId } : null;
        return await _httpClient.GetAsync<Film[]>("/ocapi/v1/films/coming-soon", queryParams, cancellationToken).ConfigureAwait(false);
    }

    public async Task<Film> GetAsync(string filmId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetAsync<Film>($"/ocapi/v1/films/{filmId}", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<FilmDetail> GetDetailAsync(string filmId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetAsync<FilmDetail>($"/ocapi/v1/films/{filmId}/detail", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<Film[]> SearchAsync(FilmFilter filter, CancellationToken cancellationToken = default)
    {
        var queryParams = new Dictionary<string, string>();
        if (filter.SiteId is not null) queryParams["siteId"] = filter.SiteId;
        if (filter.Genre is not null) queryParams["genre"] = filter.Genre;
        if (filter.Query is not null) queryParams["query"] = filter.Query;
        if (filter.NowShowing is not null) queryParams["nowShowing"] = filter.NowShowing.Value.ToString().ToLowerInvariant();
        if (filter.ComingSoon is not null) queryParams["comingSoon"] = filter.ComingSoon.Value.ToString().ToLowerInvariant();

        return await _httpClient.GetAsync<Film[]>("/ocapi/v1/films", queryParams.Count > 0 ? queryParams : null, cancellationToken).ConfigureAwait(false);
    }

    public async Task<Film[]> AdvancedSearchAsync(FilmSearchFilter filter, CancellationToken cancellationToken = default)
    {
        var queryParams = new Dictionary<string, string>();
        if (filter.SiteId is not null) queryParams["siteId"] = filter.SiteId;
        if (filter.Genre is not null) queryParams["genre"] = filter.Genre;
        if (filter.Query is not null) queryParams["query"] = filter.Query;
        if (filter.NowShowing is not null) queryParams["nowShowing"] = filter.NowShowing.Value.ToString().ToLowerInvariant();
        if (filter.ComingSoon is not null) queryParams["comingSoon"] = filter.ComingSoon.Value.ToString().ToLowerInvariant();
        if (filter.Limit is not null) queryParams["limit"] = filter.Limit.Value.ToString();
        if (filter.Offset is not null) queryParams["offset"] = filter.Offset.Value.ToString();
        if (filter.RatingClassification is not null) queryParams["ratingClassification"] = filter.RatingClassification;
        if (filter.Format is not null) queryParams["format"] = filter.Format;
        if (filter.Language is not null) queryParams["language"] = filter.Language;
        if (filter.ReleaseDateFrom is not null) queryParams["releaseDateFrom"] = filter.ReleaseDateFrom;
        if (filter.ReleaseDateTo is not null) queryParams["releaseDateTo"] = filter.ReleaseDateTo;
        if (filter.MinRuntime is not null) queryParams["minRuntime"] = filter.MinRuntime.Value.ToString();
        if (filter.MaxRuntime is not null) queryParams["maxRuntime"] = filter.MaxRuntime.Value.ToString();
        if (filter.SortBy is not null) queryParams["sortBy"] = filter.SortBy;
        if (filter.SortOrder is not null) queryParams["sortOrder"] = filter.SortOrder;

        return await _httpClient.GetAsync<Film[]>("/ocapi/v1/films/search", queryParams.Count > 0 ? queryParams : null, cancellationToken).ConfigureAwait(false);
    }
}
