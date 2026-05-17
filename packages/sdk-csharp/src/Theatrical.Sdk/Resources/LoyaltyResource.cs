using Theatrical.Sdk.Http;
using Theatrical.Sdk.Types;

namespace Theatrical.Sdk.Resources;

public sealed class LoyaltyResource
{
    private readonly ITheatricalHttpClient _httpClient;

    internal LoyaltyResource(ITheatricalHttpClient httpClient, TheatricalClientOptions options)
    {
        _httpClient = httpClient;
    }

    public async Task<LoyaltyMember> GetMemberAsync(string memberId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetAsync<LoyaltyMember>($"/ocapi/v1/loyalty/members/{memberId}", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<LoyaltyMember> AuthenticateAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        return await _httpClient.PostAsync<LoyaltyMember>("/ocapi/v1/loyalty/authenticate", new { email, password }, cancellationToken).ConfigureAwait(false);
    }

    public async Task<PointsBalance> GetPointsBalanceAsync(string memberId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetAsync<PointsBalance>($"/ocapi/v1/loyalty/members/{memberId}/points", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<PaginatedResponse<PointsTransaction>> GetHistoryAsync(string memberId, PointsHistoryFilter? filter = null, CancellationToken cancellationToken = default)
    {
        var queryParams = new Dictionary<string, string>();
        if (filter?.Type is not null) queryParams["type"] = filter.Type;
        if (filter?.Since is not null) queryParams["since"] = filter.Since;
        if (filter?.Until is not null) queryParams["until"] = filter.Until;
        if (filter?.Limit is not null) queryParams["limit"] = filter.Limit.Value.ToString();
        if (filter?.Cursor is not null) queryParams["cursor"] = filter.Cursor;

        return await _httpClient.GetAsync<PaginatedResponse<PointsTransaction>>($"/ocapi/v1/loyalty/members/{memberId}/history", queryParams.Count > 0 ? queryParams : null, cancellationToken).ConfigureAwait(false);
    }

    public async Task<RedemptionOption[]> ListRedemptionOptionsAsync(string memberId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetAsync<RedemptionOption[]>($"/ocapi/v1/loyalty/members/{memberId}/redemptions", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<PointsTransaction> RedeemPointsAsync(string memberId, RedeemPointsInput input, CancellationToken cancellationToken = default)
    {
        return await _httpClient.PostAsync<PointsTransaction>($"/ocapi/v1/loyalty/members/{memberId}/redeem", input, cancellationToken).ConfigureAwait(false);
    }
}
