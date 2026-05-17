namespace Theatrical.Sdk.Types;

public sealed record PaginatedResponse<T>
{
    public required T[] Data { get; init; }
    public required int Total { get; init; }
    public required bool HasMore { get; init; }
    public string? NextCursor { get; init; }
    public int? NextOffset { get; init; }
    public string? Strategy { get; init; }
}
