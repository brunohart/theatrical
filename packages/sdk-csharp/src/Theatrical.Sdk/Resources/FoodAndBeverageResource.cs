using Theatrical.Sdk.Http;
using Theatrical.Sdk.Types;

namespace Theatrical.Sdk.Resources;

public sealed class FoodAndBeverageResource
{
    private readonly ITheatricalHttpClient _httpClient;

    internal FoodAndBeverageResource(ITheatricalHttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<MenuItem[]> GetMenuAsync(string siteId, MenuFilter? filter = null, CancellationToken cancellationToken = default)
    {
        var queryParams = new Dictionary<string, string>();
        if (filter?.Category is not null) queryParams["category"] = filter.Category;
        if (filter?.Dietary is not null) queryParams["dietary"] = string.Join(",", filter.Dietary);
        if (filter?.PreOrderOnly is true) queryParams["preOrderOnly"] = "true";

        return await _httpClient.GetAsync<MenuItem[]>($"/ocapi/v1/sites/{siteId}/menu", queryParams.Count > 0 ? queryParams : null, cancellationToken).ConfigureAwait(false);
    }

    public async Task<MenuCategory[]> GetCategoriesAsync(string siteId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetAsync<MenuCategory[]>($"/ocapi/v1/sites/{siteId}/menu/categories", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<MenuItem> GetItemDetailAsync(string siteId, string itemId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetAsync<MenuItem>($"/ocapi/v1/sites/{siteId}/menu/items/{itemId}", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<ComboOffer[]> GetCombosAsync(string siteId, CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetAsync<ComboOffer[]>($"/ocapi/v1/sites/{siteId}/menu/combos", cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<FnbOrderConfirmation> AddToOrderAsync(AddToOrderInput input, CancellationToken cancellationToken = default)
    {
        return await _httpClient.PostAsync<FnbOrderConfirmation>($"/ocapi/v1/orders/{input.OrderId}/fnb", input, cancellationToken).ConfigureAwait(false);
    }
}
