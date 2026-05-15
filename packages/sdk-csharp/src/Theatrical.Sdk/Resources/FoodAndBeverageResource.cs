using Theatrical.Sdk.Http;
namespace Theatrical.Sdk.Resources;

public sealed class FoodAndBeverageResource
{
    private readonly ITheatricalHttpClient _httpClient;
    private readonly TheatricalClientOptions _options;

    internal FoodAndBeverageResource(ITheatricalHttpClient httpClient, TheatricalClientOptions options)
    {
        _httpClient = httpClient;
        _options = options;
    }

    public Task<Types.MenuItem[]> GetMenuAsync(string siteId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }
}
