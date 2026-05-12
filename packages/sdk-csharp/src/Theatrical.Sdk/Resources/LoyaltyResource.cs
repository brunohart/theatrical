namespace Theatrical.Sdk.Resources;

public sealed class LoyaltyResource
{
    private readonly HttpClient _httpClient;
    private readonly TheatricalClientOptions _options;

    internal LoyaltyResource(HttpClient httpClient, TheatricalClientOptions options)
    {
        _httpClient = httpClient;
        _options = options;
    }

    public Task<Types.LoyaltyMember> GetMemberAsync(string memberId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }

    public Task<Types.PointsBalance> GetPointsBalanceAsync(string memberId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("PORT-CSHARP-003");
    }
}
