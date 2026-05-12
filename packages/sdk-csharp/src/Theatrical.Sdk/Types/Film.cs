namespace Theatrical.Sdk.Types;

public sealed record Film
{
    public required string Id { get; init; }
    public required string Title { get; init; }
    public string? Synopsis { get; init; }
    public string[]? Genres { get; init; }
    public string? Rating { get; init; }
    public int? RuntimeMinutes { get; init; }
    public string? PosterUrl { get; init; }
    public DateOnly? ReleaseDate { get; init; }
    public CastMember[]? Cast { get; init; }
}

public sealed record CastMember
{
    public required string Name { get; init; }
    public string? Role { get; init; }
}
