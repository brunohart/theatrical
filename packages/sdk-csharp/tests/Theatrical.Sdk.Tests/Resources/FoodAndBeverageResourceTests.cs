using Xunit;
using Theatrical.Sdk.Types;

namespace Theatrical.Sdk.Tests.Resources;

public sealed class FoodAndBeverageResourceTests : IDisposable
{
    private readonly TheatricalClient _client = TheatricalClient.CreateMock();

    [Fact]
    public async Task GetMenuAsync_returns_menu_items()
    {
        var items = await _client.FoodAndBeverage.GetMenuAsync("site_roxy_wellington");

        Assert.NotNull(items);
        Assert.Equal(3, items.Length);
        Assert.Equal("item_popcorn_large", items[0].Id);
        Assert.Equal("Large Popcorn", items[0].Name);
        Assert.Equal(9.50m, items[0].Price);
        Assert.Contains("gluten-free", items[0].DietaryFlags!);
    }

    [Fact]
    public async Task GetCategoriesAsync_returns_categories()
    {
        var categories = await _client.FoodAndBeverage.GetCategoriesAsync("site_roxy_wellington");

        Assert.NotNull(categories);
        Assert.Equal(4, categories.Length);
        Assert.Equal("Popcorn", categories[0].Name);
        Assert.Equal(1, categories[0].DisplayOrder);
    }

    [Fact]
    public async Task GetItemDetailAsync_returns_item_with_customizations()
    {
        var item = await _client.FoodAndBeverage.GetItemDetailAsync("site_roxy_wellington", "item_popcorn_large");

        Assert.NotNull(item);
        Assert.Equal("item_popcorn_large", item.Id);
        Assert.NotNull(item.Customizations);
        Assert.Single(item.Customizations);
        Assert.Equal("Flavour", item.Customizations[0].Name);
        Assert.Contains("Caramel", item.Customizations[0].Options!);
    }

    [Fact]
    public async Task GetCombosAsync_returns_combo_offers()
    {
        var combos = await _client.FoodAndBeverage.GetCombosAsync("site_roxy_wellington");

        Assert.NotNull(combos);
        Assert.Single(combos);
        Assert.Equal("Date Night Combo", combos[0].Name);
        Assert.Equal(22.00m, combos[0].Price);
        Assert.Equal(4.50m, combos[0].Savings);
        Assert.NotNull(combos[0].Items);
        Assert.Equal(2, combos[0].Items.Length);
    }

    public void Dispose() => _client.Dispose();
}
