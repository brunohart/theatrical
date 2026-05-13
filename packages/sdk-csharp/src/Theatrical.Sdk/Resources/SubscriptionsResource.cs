using Theatrical.Sdk.Http;
namespace Theatrical.Sdk.Resources;

public sealed class SubscriptionsResource
{
    private readonly ITheatricalHttpClient _httpClient;
    private readonly TheatricalClientOptions _options;

    internal SubscriptionsResource(ITheatricalHttpClient httpClient, TheatricalClientOptions options)
    {
        _httpClient = httpClient;
        _options = options;
    }

    public Task<Types.SubscriptionPlan[]> ListPlansAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }

    public Task<Types.MemberSubscription> GetMemberSubscriptionAsync(string memberId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }
}
