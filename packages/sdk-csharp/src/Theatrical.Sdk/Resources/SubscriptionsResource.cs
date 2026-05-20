using Theatrical.Sdk.Http;
using Theatrical.Sdk.Types;

namespace Theatrical.Sdk.Resources;

public sealed class SubscriptionsResource
{
    private readonly ITheatricalHttpClient _httpClient;

    internal SubscriptionsResource(ITheatricalHttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<SubscriptionPlan[]> ListPlansAsync(string? siteId = null, bool includeUnavailable = false, CancellationToken cancellationToken = default)
    {
        var queryParams = new Dictionary<string, string>();
        if (siteId is not null) queryParams["siteId"] = siteId;
        if (includeUnavailable) queryParams["includeUnavailable"] = "true";

        return await _httpClient.GetAsync<SubscriptionPlan[]>("/ocapi/v1/subscriptions/plans", queryParams.Count > 0 ? queryParams : null, cancellationToken).ConfigureAwait(false);
    }

    public async Task<MemberSubscription> GetMemberSubscriptionAsync(string memberId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetAsync<MemberSubscription>($"/ocapi/v1/subscriptions/members/{memberId}", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<SubscriptionUsage> GetUsageAsync(string memberId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetAsync<SubscriptionUsage>($"/ocapi/v1/subscriptions/members/{memberId}/usage", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<BenefitEligibility> CheckBenefitEligibilityAsync(string memberId, string benefitId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetAsync<BenefitEligibility>($"/ocapi/v1/subscriptions/members/{memberId}/benefits/{benefitId}/eligibility", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<MemberSubscription> SuspendAsync(string memberId, SuspendSubscriptionInput? input = null, CancellationToken cancellationToken = default)
    {
        return await _httpClient.PostAsync<MemberSubscription>($"/ocapi/v1/subscriptions/members/{memberId}/suspend", input ?? new SuspendSubscriptionInput(), cancellationToken).ConfigureAwait(false);
    }

    public async Task<MemberSubscription> CancelAsync(string memberId, CancelSubscriptionInput? input = null, CancellationToken cancellationToken = default)
    {
        return await _httpClient.PostAsync<MemberSubscription>($"/ocapi/v1/subscriptions/members/{memberId}/cancel", input ?? new CancelSubscriptionInput(), cancellationToken).ConfigureAwait(false);
    }
}
