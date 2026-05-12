namespace Theatrical.Sdk.Types;

public sealed record Session
{
    public required string Id { get; init; }
    public required string SiteId { get; init; }
    public required string FilmId { get; init; }
    public required string ScreenId { get; init; }
    public required DateTimeOffset StartTime { get; init; }
    public required string Format { get; init; }
    public string? AudioLanguage { get; init; }
    public string? SubtitleLanguage { get; init; }
    public int? AvailableSeats { get; init; }
    public int? TotalSeats { get; init; }
}

public sealed record SeatAvailability
{
    public required string SessionId { get; init; }
    public required Seat[] Seats { get; init; }
}

public sealed record Seat
{
    public required string Id { get; init; }
    public required string Row { get; init; }
    public required int Number { get; init; }
    public required SeatStatus Status { get; init; }
    public string? SeatType { get; init; }
}

public enum SeatStatus
{
    Available,
    Taken,
    Selected,
    Wheelchair,
    Blocked
}
