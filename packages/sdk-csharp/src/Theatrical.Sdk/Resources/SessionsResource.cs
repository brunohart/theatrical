using System.Runtime.CompilerServices;
using Theatrical.Sdk.Http;
using Theatrical.Sdk.Types;

namespace Theatrical.Sdk.Resources;

public sealed class SessionsResource
{
    private readonly ITheatricalHttpClient _httpClient;
    private const int DefaultPageSize = 50;

    internal SessionsResource(ITheatricalHttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<SessionListResponse> ListAsync(SessionFilter? filter = null, CancellationToken cancellationToken = default)
    {
        var queryParams = BuildFilterParams(filter);
        return await _httpClient.GetAsync<SessionListResponse>("/ocapi/v1/sessions", queryParams, cancellationToken).ConfigureAwait(false);
    }

    public async Task<PaginatedResponse<Session>> ListPaginatedAsync(SessionFilter? filter = null, int? limit = null, int? offset = null, string? cursor = null, CancellationToken cancellationToken = default)
    {
        var pageSize = limit ?? DefaultPageSize;
        var useCursor = cursor is not null;

        var mergedFilter = (filter ?? new SessionFilter()) with
        {
            Limit = pageSize,
            Offset = useCursor ? null : (offset ?? 0),
            Cursor = cursor,
        };

        var response = await ListAsync(mergedFilter, cancellationToken).ConfigureAwait(false);

        return new PaginatedResponse<Session>
        {
            Data = response.Sessions,
            Total = response.Total,
            HasMore = response.HasMore,
            NextCursor = response.NextCursor,
            NextOffset = response.NextOffset,
            Strategy = useCursor ? "cursor" : "offset",
        };
    }

    public async IAsyncEnumerable<Session> ListAllAsync(SessionFilter? filter = null, int pageSize = DefaultPageSize, [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var currentOffset = 0;
        var hasMore = true;

        while (hasMore)
        {
            var mergedFilter = (filter ?? new SessionFilter()) with
            {
                Limit = pageSize,
                Offset = currentOffset,
            };

            var response = await ListAsync(mergedFilter, cancellationToken).ConfigureAwait(false);

            foreach (var session in response.Sessions)
                yield return session;

            hasMore = response.HasMore;
            currentOffset = response.NextOffset ?? currentOffset + response.Sessions.Length;
        }
    }

    public async Task<Session> GetAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetAsync<Session>($"/ocapi/v1/sessions/{sessionId}", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<SeatAvailability> GetAvailabilityAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetAsync<SeatAvailability>($"/ocapi/v1/sessions/{sessionId}/seat-plan", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    private static Dictionary<string, string>? BuildFilterParams(SessionFilter? filter)
    {
        if (filter is null) return null;
        var p = new Dictionary<string, string>();
        if (filter.SiteId is not null) p["siteId"] = filter.SiteId;
        if (filter.FilmId is not null) p["filmId"] = filter.FilmId;
        if (filter.Date is not null) p["date"] = filter.Date;
        if (filter.DateFrom is not null) p["dateFrom"] = filter.DateFrom;
        if (filter.DateTo is not null) p["dateTo"] = filter.DateTo;
        if (filter.Format is not null) p["format"] = filter.Format;
        if (filter.BookableOnly is true) p["bookableOnly"] = "true";
        if (filter.Limit is not null) p["limit"] = filter.Limit.Value.ToString();
        if (filter.Offset is not null) p["offset"] = filter.Offset.Value.ToString();
        if (filter.Cursor is not null) p["cursor"] = filter.Cursor;
        return p.Count > 0 ? p : null;
    }
}
