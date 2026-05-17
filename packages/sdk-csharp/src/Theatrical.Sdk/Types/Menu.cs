namespace Theatrical.Sdk.Types;

public sealed record MenuItem
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required decimal Price { get; init; }
    public string? Category { get; init; }
    public string? Description { get; init; }
    public string[]? DietaryFlags { get; init; }
    public bool IsAvailable { get; init; } = true;
    public MenuCustomization[]? Customizations { get; init; }
}

public sealed record MenuCustomization
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public string[]? Options { get; init; }
}

public sealed record MenuCategory
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public int DisplayOrder { get; init; }
}

public sealed record ComboOffer
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required decimal Price { get; init; }
    public decimal Savings { get; init; }
    public string? Description { get; init; }
    public ComboItem[]? Items { get; init; }
}

public sealed record ComboItem
{
    public required string MenuItemId { get; init; }
    public required string Name { get; init; }
    public int Quantity { get; init; } = 1;
}

public sealed record AddToOrderInput
{
    public required string OrderId { get; init; }
    public required FnbItem[] Items { get; init; }
    public string? SessionId { get; init; }
}

public sealed record FnbItem
{
    public required string MenuItemId { get; init; }
    public required int Quantity { get; init; }
}

public sealed record FnbOrderConfirmation
{
    public required string OrderId { get; init; }
    public decimal FnbSubtotal { get; init; }
    public FnbLineItem[]? Items { get; init; }
}

public sealed record FnbLineItem
{
    public required string MenuItemId { get; init; }
    public required string Name { get; init; }
    public int Quantity { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal TotalPrice { get; init; }
}

public sealed record MenuFilter
{
    public string? Category { get; init; }
    public string[]? Dietary { get; init; }
    public bool? PreOrderOnly { get; init; }
}
