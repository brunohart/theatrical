using Theatrical.Sdk.Http;
namespace Theatrical.Sdk.Resources;

public sealed class OrdersResource
{
    private readonly ITheatricalHttpClient _httpClient;
    private readonly TheatricalClientOptions _options;

    internal OrdersResource(ITheatricalHttpClient httpClient, TheatricalClientOptions options)
    {
        _httpClient = httpClient;
        _options = options;
    }

    public Task<Types.Order> CreateAsync(Types.CreateOrderRequest request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }

    public Task<Types.Order> GetAsync(string id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }

    public Task<Types.Order> ConfirmAsync(string id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }

    public Task<Types.Order> CancelAsync(string id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }
}
