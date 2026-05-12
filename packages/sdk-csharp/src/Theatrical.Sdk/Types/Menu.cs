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
}
