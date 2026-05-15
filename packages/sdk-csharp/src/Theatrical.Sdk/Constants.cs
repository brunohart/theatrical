namespace Theatrical.Sdk;

/// <summary>
/// SDK-wide constants for the Theatrical C# SDK.
/// </summary>
public static class SdkConstants
{
    /// <summary>Current SDK version.</summary>
    public const string Version = "0.1.0";

    /// <summary>User-Agent header value sent with all requests.</summary>
    public const string UserAgent = "theatrical-csharp/0.1.0";

    /// <summary>Default request timeout in seconds.</summary>
    public const int DefaultTimeoutSeconds = 30;

    /// <summary>Default maximum retry attempts for transient failures.</summary>
    public const int DefaultMaxRetries = 3;

    /// <summary>Maximum items per page for paginated endpoints.</summary>
    public const int MaxPageSize = 500;

    /// <summary>Default page size for list operations.</summary>
    public const int DefaultPageSize = 50;
}
