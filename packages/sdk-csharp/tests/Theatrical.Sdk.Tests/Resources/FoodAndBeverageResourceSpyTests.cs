using Xunit;
using Theatrical.Sdk.Resources;
using Theatrical.Sdk.Types;
using Theatrical.Sdk.Errors;
using Theatrical.Sdk.Tests.TestInfrastructure;

namespace Theatrical.Sdk.Tests.Resources;

public sealed class FoodAndBeverageResourceSpyTests
{
    private static FoodAndBeverageResource CreateResource(SpyHttpClient spy)
        => new(spy);

    private static MenuItem CreateMenuItem(
        string? id = null,
        string? name = null,
        decimal price = 8.50m,
        string? category = null)
    {
        return new MenuItem
        {
            Id = id ?? "item_popcorn_large",
            Name = name ?? "Large Popcorn",
            Price = price,
            Category = category ?? "snacks",
            Description = "Freshly popped buttered popcorn",
            DietaryFlags = ["vegetarian", "gluten-free"],
            IsAvailable = true,
        };
    }

    [Fact]
    public async Task GetMenuAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateMenuItem() });
        var resource = CreateResource(spy);

        await resource.GetMenuAsync("site_roxy");

        Assert.Single(spy.Calls);
        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/sites/site_roxy/menu", spy.LastCall.Path);
    }

    [Fact]
    public async Task GetMenuAsync_sends_no_params_without_filter()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateMenuItem() });
        var resource = CreateResource(spy);

        await resource.GetMenuAsync("site_roxy");

        Assert.Null(spy.LastCall.QueryParams);
    }

    [Fact]
    public async Task GetMenuAsync_passes_category_filter()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateMenuItem() });
        var resource = CreateResource(spy);

        await resource.GetMenuAsync("site_roxy", new MenuFilter { Category = "drinks" });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("drinks", spy.LastCall.QueryParams["category"]);
    }

    [Fact]
    public async Task GetMenuAsync_passes_dietary_filters()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateMenuItem() });
        var resource = CreateResource(spy);

        await resource.GetMenuAsync("site_roxy", new MenuFilter { Dietary = ["vegan", "gluten-free"] });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("vegan,gluten-free", spy.LastCall.QueryParams["dietary"]);
    }

    [Fact]
    public async Task GetMenuAsync_passes_preOrderOnly_flag()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateMenuItem() });
        var resource = CreateResource(spy);

        await resource.GetMenuAsync("site_roxy", new MenuFilter { PreOrderOnly = true });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("true", spy.LastCall.QueryParams["preOrderOnly"]);
    }

    [Fact]
    public async Task GetMenuAsync_returns_multiple_items()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[]
        {
            CreateMenuItem(id: "item_popcorn", name: "Large Popcorn", price: 8.50m),
            CreateMenuItem(id: "item_nachos", name: "Nachos", price: 12.00m, category: "snacks"),
            CreateMenuItem(id: "item_cola", name: "Cola", price: 5.50m, category: "drinks"),
        });
        var resource = CreateResource(spy);

        var result = await resource.GetMenuAsync("site_roxy");

        Assert.Equal(3, result.Length);
        Assert.Equal("Large Popcorn", result[0].Name);
        Assert.Equal(12.00m, result[1].Price);
        Assert.Equal("drinks", result[2].Category);
    }

    [Fact]
    public async Task GetMenuAsync_returns_dietary_flags()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateMenuItem() });
        var resource = CreateResource(spy);

        var result = await resource.GetMenuAsync("site_roxy");

        Assert.NotNull(result[0].DietaryFlags);
        Assert.Contains("vegetarian", result[0].DietaryFlags);
        Assert.Contains("gluten-free", result[0].DietaryFlags);
    }

    [Fact]
    public async Task GetCategoriesAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[]
        {
            new MenuCategory { Id = "cat_snacks", Name = "Snacks", DisplayOrder = 1 },
        });
        var resource = CreateResource(spy);

        await resource.GetCategoriesAsync("site_roxy");

        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/sites/site_roxy/menu/categories", spy.LastCall.Path);
    }

    [Fact]
    public async Task GetCategoriesAsync_returns_categories_with_order()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[]
        {
            new MenuCategory { Id = "cat_snacks", Name = "Snacks", DisplayOrder = 1 },
            new MenuCategory { Id = "cat_drinks", Name = "Drinks", DisplayOrder = 2 },
            new MenuCategory { Id = "cat_combos", Name = "Combos", DisplayOrder = 3 },
        });
        var resource = CreateResource(spy);

        var result = await resource.GetCategoriesAsync("site_roxy");

        Assert.Equal(3, result.Length);
        Assert.Equal("Snacks", result[0].Name);
        Assert.Equal(2, result[1].DisplayOrder);
    }

    [Fact]
    public async Task GetItemDetailAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateMenuItem());
        var resource = CreateResource(spy);

        await resource.GetItemDetailAsync("site_roxy", "item_popcorn_large");

        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/sites/site_roxy/menu/items/item_popcorn_large", spy.LastCall.Path);
    }

    [Fact]
    public async Task GetItemDetailAsync_returns_item_with_customizations()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new MenuItem
        {
            Id = "item_popcorn",
            Name = "Large Popcorn",
            Price = 8.50m,
            Category = "snacks",
            Customizations =
            [
                new MenuCustomization { Id = "cust_butter", Name = "Butter", Options = ["none", "light", "extra"] },
                new MenuCustomization { Id = "cust_salt", Name = "Salt", Options = ["regular", "extra"] },
            ],
        });
        var resource = CreateResource(spy);

        var result = await resource.GetItemDetailAsync("site_roxy", "item_popcorn");

        Assert.NotNull(result.Customizations);
        Assert.Equal(2, result.Customizations.Length);
        Assert.Equal("Butter", result.Customizations[0].Name);
        Assert.NotNull(result.Customizations[0].Options);
        Assert.Equal(3, result.Customizations[0].Options.Length);
    }

    [Fact]
    public async Task GetCombosAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[]
        {
            new ComboOffer
            {
                Id = "combo_001",
                Name = "Date Night",
                Price = 35.00m,
                Savings = 8.50m,
                Items =
                [
                    new ComboItem { MenuItemId = "item_popcorn", Name = "Large Popcorn", Quantity = 1 },
                    new ComboItem { MenuItemId = "item_cola", Name = "Cola", Quantity = 2 },
                ],
            },
        });
        var resource = CreateResource(spy);

        await resource.GetCombosAsync("site_roxy");

        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/sites/site_roxy/menu/combos", spy.LastCall.Path);
    }

    [Fact]
    public async Task GetCombosAsync_returns_combo_details()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[]
        {
            new ComboOffer
            {
                Id = "combo_001",
                Name = "Date Night",
                Price = 35.00m,
                Savings = 8.50m,
                Items =
                [
                    new ComboItem { MenuItemId = "item_popcorn", Name = "Large Popcorn", Quantity = 1 },
                    new ComboItem { MenuItemId = "item_cola", Name = "Cola", Quantity = 2 },
                ],
            },
        });
        var resource = CreateResource(spy);

        var result = await resource.GetCombosAsync("site_roxy");

        Assert.Single(result);
        Assert.Equal("Date Night", result[0].Name);
        Assert.Equal(35.00m, result[0].Price);
        Assert.Equal(8.50m, result[0].Savings);
        Assert.NotNull(result[0].Items);
        Assert.Equal(2, result[0].Items.Length);
    }

    [Fact]
    public async Task AddToOrderAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new FnbOrderConfirmation
        {
            OrderId = "ord_001",
            FnbSubtotal = 17.00m,
            Items =
            [
                new FnbLineItem { MenuItemId = "item_popcorn", Name = "Large Popcorn", Quantity = 2, UnitPrice = 8.50m, TotalPrice = 17.00m },
            ],
        });
        var resource = CreateResource(spy);

        await resource.AddToOrderAsync(new AddToOrderInput
        {
            OrderId = "ord_001",
            Items = [new FnbItem { MenuItemId = "item_popcorn", Quantity = 2 }],
        });

        Assert.Equal("POST", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/orders/ord_001/fnb", spy.LastCall.Path);
    }

    [Fact]
    public async Task AddToOrderAsync_sends_input_body()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new FnbOrderConfirmation
        {
            OrderId = "ord_001",
            FnbSubtotal = 8.50m,
        });
        var resource = CreateResource(spy);

        await resource.AddToOrderAsync(new AddToOrderInput
        {
            OrderId = "ord_001",
            Items = [new FnbItem { MenuItemId = "item_popcorn", Quantity = 1 }],
            SessionId = "ses_001",
        });

        Assert.NotNull(spy.LastCall.Body);
    }

    [Fact]
    public async Task AddToOrderAsync_returns_confirmation()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new FnbOrderConfirmation
        {
            OrderId = "ord_001",
            FnbSubtotal = 17.00m,
            Items =
            [
                new FnbLineItem { MenuItemId = "item_popcorn", Name = "Large Popcorn", Quantity = 2, UnitPrice = 8.50m, TotalPrice = 17.00m },
            ],
        });
        var resource = CreateResource(spy);

        var result = await resource.AddToOrderAsync(new AddToOrderInput
        {
            OrderId = "ord_001",
            Items = [new FnbItem { MenuItemId = "item_popcorn", Quantity = 2 }],
        });

        Assert.Equal("ord_001", result.OrderId);
        Assert.Equal(17.00m, result.FnbSubtotal);
        Assert.NotNull(result.Items);
        Assert.Single(result.Items);
        Assert.Equal(2, result.Items[0].Quantity);
    }

    [Fact]
    public async Task GetMenuAsync_propagates_not_found_error()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueError(new NotFoundException("Site", "site_nonexistent"));
        var resource = CreateResource(spy);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            resource.GetMenuAsync("site_nonexistent"));
    }

    [Fact]
    public async Task AddToOrderAsync_propagates_validation_error()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueError(new ValidationException("Order not found"));
        var resource = CreateResource(spy);

        await Assert.ThrowsAsync<ValidationException>(() =>
            resource.AddToOrderAsync(new AddToOrderInput
            {
                OrderId = "ord_nonexistent",
                Items = [new FnbItem { MenuItemId = "item_001", Quantity = 1 }],
            }));
    }
}
