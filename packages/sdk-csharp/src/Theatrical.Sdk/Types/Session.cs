namespace Theatrical.Sdk.Types;

public sealed record Session
{
    public required string Id { get; init; }
    public required string FilmId { get; init; }
    public string? FilmTitle { get; init; }
    public required string SiteId { get; init; }
    public string? ScreenId { get; init; }
    public string? ScreenName { get; init; }
    public required string StartTime { get; init; }
    public string? EndTime { get; init; }
    public required string Format { get; init; }
    public bool IsBookable { get; init; }
    public bool IsSoldOut { get; init; }
    public int SeatsAvailable { get; init; }
    public int SeatsTotal { get; init; }
    public decimal? PriceFrom { get; init; }
    public string? Currency { get; init; }
    public Dictionary<string, string>? Attributes { get; init; }
}

public sealed record SessionFilter
{
    public string? SiteId { get; init; }
    public string? FilmId { get; init; }
    public string? Date { get; init; }
    public string? DateFrom { get; init; }
    public string? DateTo { get; init; }
    public string? Format { get; init; }
    public bool? BookableOnly { get; init; }
    public int? Limit { get; init; }
    public int? Offset { get; init; }
    public string? Cursor { get; init; }
}

public sealed record SessionListResponse
{
    public required Session[] Sessions { get; init; }
    public required int Total { get; init; }
    public required bool HasMore { get; init; }
    public int? NextOffset { get; init; }
    public string? NextCursor { get; init; }
}

public sealed record SeatAvailability
{
    public required string SessionId { get; init; }
    public string? ScreenName { get; init; }
    public required Seat[] Seats { get; init; }
    public int RowCount { get; init; }
    public string? ScreenPosition { get; init; }
    public int AvailableCount { get; init; }
    public int TotalCount { get; init; }
}

public sealed record Seat
{
    public required string Id { get; init; }
    public required string Row { get; init; }
    public required int Number { get; init; }
    public required string Status { get; init; }
    public double X { get; init; }
    public double Y { get; init; }
    public string? Type { get; init; }
    public bool IsAccessible { get; init; }
}

public static class SeatStatuses
{
    public const string Available = "available";
    public const string Taken = "taken";
    public const string Reserved = "reserved";
    public const string Wheelchair = "wheelchair";
    public const string Companion = "companion";
    public const string Blocked = "blocked";
}

public static class SessionFormats
{
    public const string Standard = "STANDARD";
    public const string TwoD = "2D";
    public const string ThreeD = "3D";
    public const string Imax = "IMAX";
    public const string Imax3D = "IMAX3D";
    public const string FourDX = "4DX";
    public const string DolbyCinema = "DOLBY_CINEMA";
    public const string ScreenX = "SCREENX";
}
