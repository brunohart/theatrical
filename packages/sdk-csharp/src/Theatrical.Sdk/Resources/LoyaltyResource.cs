using Theatrical.Sdk.Http;
namespace Theatrical.Sdk.Resources;

public sealed class LoyaltyResource
{
    private readonly ITheatricalHttpClient _httpClient;
    private readonly TheatricalClientOptions _options;

    internal LoyaltyResource(ITheatricalHttpClient httpClient, TheatricalClientOptions options)
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
