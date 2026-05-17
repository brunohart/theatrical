using Theatrical.Sdk.Http;
using Theatrical.Sdk.Types;

namespace Theatrical.Sdk.Resources;

public sealed class PricingResource
{
    private readonly ITheatricalHttpClient _httpClient;

    internal PricingResource(ITheatricalHttpClient httpClient, TheatricalClientOptions options)
    {
        _httpClient = httpClient;
    }

    public async Task<TicketType[]> GetTicketTypesAsync(string sessionId, TicketTypeFilter? filter = null, CancellationToken cancellationToken = default)
    {
        var queryParams = new Dictionary<string, string>();
        if (filter?.Category is not null) queryParams["category"] = filter.Category;
        if (filter?.AvailableOnly is true) queryParams["availableOnly"] = "true";

        return await _httpClient.GetAsync<TicketType[]>($"/ocapi/v1/sessions/{sessionId}/ticket-types", queryParams.Count > 0 ? queryParams : null, cancellationToken).ConfigureAwait(false);
    }

    public async Task<PriceCalculation> CalculateAsync(string sessionId, string ticketTypeId, int quantity = 1, CancellationToken cancellationToken = default)
    {
        var queryParams = new Dictionary<string, string>
        {
            ["sessionId"] = sessionId,
            ["ticketTypeId"] = ticketTypeId,
            ["quantity"] = quantity.ToString(),
        };

        return await _httpClient.GetAsync<PriceCalculation>("/ocapi/v1/pricing/calculate", queryParams, cancellationToken).ConfigureAwait(false);
    }

    public async Task<CouponApplicationResult> ApplyCouponsAsync(ApplyCouponsInput input, CancellationToken cancellationToken = default)
    {
        return await _httpClient.PostAsync<CouponApplicationResult>("/ocapi/v1/pricing/apply-coupons", input, cancellationToken).ConfigureAwait(false);
    }
}
