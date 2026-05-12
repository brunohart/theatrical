namespace Theatrical.Sdk.Resources;

public sealed class PricingResource
{
    private readonly HttpClient _httpClient;
    private readonly TheatricalClientOptions _options;

    internal PricingResource(HttpClient httpClient, TheatricalClientOptions options)
    {
        _httpClient = httpClient;
        _options = options;
    }

    public Task<Types.TicketType[]> GetTicketTypesAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }

    public Task<Types.PriceCalculation> CalculateAsync(Types.PriceCalculationRequest request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }
}
