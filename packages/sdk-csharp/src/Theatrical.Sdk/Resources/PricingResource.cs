using Theatrical.Sdk.Http;
namespace Theatrical.Sdk.Resources;

public sealed class PricingResource
{
    private readonly ITheatricalHttpClient _httpClient;
    private readonly TheatricalClientOptions _options;

    internal PricingResource(ITheatricalHttpClient httpClient, TheatricalClientOptions options)
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
