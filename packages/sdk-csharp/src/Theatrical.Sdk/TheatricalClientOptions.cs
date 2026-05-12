namespace Theatrical.Sdk;

public sealed class TheatricalClientOptions
{
    public required string ApiKey { get; init; }

    public TheatricalEnvironment Environment { get; init; } = TheatricalEnvironment.Sandbox;

    public string? BaseUrl { get; init; }

    public TimeSpan Timeout { get; init; } = TimeSpan.FromSeconds(30);

    public int MaxRetries { get; init; } = 3;

    public bool Debug { get; init; }

    internal string ResolvedBaseUrl => BaseUrl ?? Environment.GetBaseUrl();

    internal void Validate()
    {
        if (string.IsNullOrWhiteSpace(ApiKey))
            throw new Errors.ValidationException("apiKey must not be empty");

        if (Timeout <= TimeSpan.Zero || Timeout > TimeSpan.FromSeconds(120))
            throw new Errors.ValidationException("timeout must be between 0 and 120000ms");

        if (MaxRetries < 0 || MaxRetries > 10)
            throw new Errors.ValidationException("maxRetries must be between 0 and 10");

        if (BaseUrl is not null && !Uri.TryCreate(BaseUrl, UriKind.Absolute, out _))
            throw new Errors.ValidationException("baseUrl must be a valid URL");
    }
}
