namespace Theatrical.Sdk.Types;

public sealed record Site
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public string? Address { get; init; }
    public string? City { get; init; }
    public string? Country { get; init; }
    public double? Latitude { get; init; }
    public double? Longitude { get; init; }
    public string? TimeZone { get; init; }
    public Screen[]? Screens { get; init; }
}

public sealed record Screen
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public int? Capacity { get; init; }
    public string[]? Formats { get; init; }
}
