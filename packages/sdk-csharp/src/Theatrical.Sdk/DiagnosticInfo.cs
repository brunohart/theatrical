using System.Runtime.InteropServices;

namespace Theatrical.Sdk;

/// <summary>
/// Diagnostic information about the SDK runtime environment.
/// </summary>
public sealed record DiagnosticInfo
{
    /// <summary>SDK version string.</summary>
    public string SdkVersion { get; init; } = SdkConstants.Version;

    /// <summary>Target .NET runtime version.</summary>
    public string Runtime { get; init; } = RuntimeInformation.FrameworkDescription;

    /// <summary>Operating system description.</summary>
    public string OperatingSystem { get; init; } = RuntimeInformation.OSDescription;

    /// <summary>Configured environment.</summary>
    public VistaEnvironment Environment { get; init; }

    /// <summary>Base URL in use.</summary>
    public string BaseUrl { get; init; } = string.Empty;

    /// <summary>Configured timeout in seconds.</summary>
    public int TimeoutSeconds { get; init; } = SdkConstants.DefaultTimeoutSeconds;

    /// <summary>
    /// Create diagnostic info from the current client configuration.
    /// </summary>
    public static DiagnosticInfo FromEnvironment(VistaEnvironment env) => new()
    {
        Environment = env,
        BaseUrl = EnvironmentResolver.GetBaseUrl(env),
    };
}
