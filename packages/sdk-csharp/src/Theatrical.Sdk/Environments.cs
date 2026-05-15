namespace Theatrical.Sdk;

/// <summary>
/// Vista platform environment configuration.
/// </summary>
public enum VistaEnvironment
{
    /// <summary>Sandbox environment for development and testing.</summary>
    Sandbox,

    /// <summary>Staging environment for pre-production validation.</summary>
    Staging,

    /// <summary>Production environment — live Vista platform.</summary>
    Production
}

/// <summary>
/// Resolves Vista API base URLs from environment identifiers.
/// </summary>
public static class EnvironmentResolver
{
    /// <summary>
    /// Get the base URL for a Vista environment.
    /// </summary>
    public static string GetBaseUrl(VistaEnvironment environment) => environment switch
    {
        VistaEnvironment.Sandbox => "https://api.sandbox.vista.co",
        VistaEnvironment.Staging => "https://api.staging.vista.co",
        VistaEnvironment.Production => "https://api.vista.co",
        _ => throw new ArgumentOutOfRangeException(nameof(environment))
    };
}
