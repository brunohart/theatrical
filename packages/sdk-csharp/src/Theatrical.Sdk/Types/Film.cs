namespace Theatrical.Sdk.Types;

public sealed record Film
{
    public required string Id { get; init; }
    public required string Title { get; init; }
    public string? Synopsis { get; init; }
    public string[]? Genres { get; init; }
    public string? Rating { get; init; }
    public int? RuntimeMinutes { get; init; }
    public int? Runtime { get; init; }
    public string? PosterUrl { get; init; }
    public string? ReleaseDate { get; init; }
    public string? Director { get; init; }
    public bool IsNowShowing { get; init; }
    public bool IsComingSoon { get; init; }
    public CastMember[]? Cast { get; init; }
}

public sealed record FilmDetail
{
    public required string Id { get; init; }
    public required string Title { get; init; }
    public string? Synopsis { get; init; }
    public string[]? Genres { get; init; }
    public string? Rating { get; init; }
    public int? RuntimeMinutes { get; init; }
    public string? PosterUrl { get; init; }
    public string? ReleaseDate { get; init; }
    public string? Director { get; init; }
    public CastMember[]? Cast { get; init; }
    public CrewMember[]? Crew { get; init; }
    public FilmRating[]? Ratings { get; init; }
    public string[]? Formats { get; init; }
    public string[]? Languages { get; init; }
}

public sealed record CastMember
{
    public required string Name { get; init; }
    public string? Role { get; init; }
}

public sealed record CrewMember
{
    public required string Name { get; init; }
    public required string Department { get; init; }
    public string? Job { get; init; }
}

public sealed record FilmRating
{
    public required string Source { get; init; }
    public required string Value { get; init; }
}

public sealed record FilmFilter
{
    public string? SiteId { get; init; }
    public string? Genre { get; init; }
    public string? Query { get; init; }
    public bool? NowShowing { get; init; }
    public bool? ComingSoon { get; init; }
}

public sealed record FilmSearchFilter
{
    public string? SiteId { get; init; }
    public string? Genre { get; init; }
    public string? Query { get; init; }
    public bool? NowShowing { get; init; }
    public bool? ComingSoon { get; init; }
    public int? Limit { get; init; }
    public int? Offset { get; init; }
    public string? RatingClassification { get; init; }
    public string? Format { get; init; }
    public string? Language { get; init; }
    public string? ReleaseDateFrom { get; init; }
    public string? ReleaseDateTo { get; init; }
    public int? MinRuntime { get; init; }
    public int? MaxRuntime { get; init; }
    public string? SortBy { get; init; }
    public string? SortOrder { get; init; }
}
