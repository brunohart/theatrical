using Theatrical.Sdk.Http;
using Theatrical.Sdk.Types;

namespace Theatrical.Sdk.Resources;

public sealed class OrdersResource
{
    private readonly ITheatricalHttpClient _httpClient;

    internal OrdersResource(ITheatricalHttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<Order> CreateAsync(CreateOrderRequest request, CancellationToken cancellationToken = default)
    {
        return await _httpClient.PostAsync<Order>("/ocapi/v1/orders", request, cancellationToken).ConfigureAwait(false);
    }

    public async Task<Order> GetAsync(string orderId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetAsync<Order>($"/ocapi/v1/orders/{orderId}", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<Order> AddTicketsAsync(string orderId, AddTicketsInput input, CancellationToken cancellationToken = default)
    {
        return await _httpClient.PostAsync<Order>($"/ocapi/v1/orders/{orderId}/tickets", input, cancellationToken).ConfigureAwait(false);
    }

    public async Task<Order> AddItemsAsync(string orderId, AddItemsInput input, CancellationToken cancellationToken = default)
    {
        return await _httpClient.PostAsync<Order>($"/ocapi/v1/orders/{orderId}/items", input, cancellationToken).ConfigureAwait(false);
    }

    public async Task<Order> ConfirmAsync(string orderId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.PostAsync<Order>($"/ocapi/v1/orders/{orderId}/confirm", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<Order> CancelAsync(string orderId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.PostAsync<Order>($"/ocapi/v1/orders/{orderId}/cancel", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<Order> ApplyLoyaltyAsync(string orderId, ApplyLoyaltyInput input, CancellationToken cancellationToken = default)
    {
        return await _httpClient.PostAsync<Order>($"/ocapi/v1/orders/{orderId}/loyalty", input, cancellationToken).ConfigureAwait(false);
    }

    public async Task<Order> RefundAsync(string orderId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.PostAsync<Order>($"/ocapi/v1/orders/{orderId}/refund", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<Order> CompleteAsync(string orderId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.PostAsync<Order>($"/ocapi/v1/orders/{orderId}/complete", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<PaginatedResponse<Order>> HistoryAsync(string memberId, OrderHistoryFilter? filter = null, CancellationToken cancellationToken = default)
    {
        var queryParams = new Dictionary<string, string>();
        if (filter?.Status is not null) queryParams["status"] = filter.Status;
        if (filter?.Since is not null) queryParams["since"] = filter.Since;
        if (filter?.Until is not null) queryParams["until"] = filter.Until;
        if (filter?.Limit is not null) queryParams["limit"] = filter.Limit.Value.ToString();
        if (filter?.Cursor is not null) queryParams["cursor"] = filter.Cursor;

        return await _httpClient.GetAsync<PaginatedResponse<Order>>($"/ocapi/v1/members/{memberId}/orders", queryParams.Count > 0 ? queryParams : null, cancellationToken).ConfigureAwait(false);
    }
}
