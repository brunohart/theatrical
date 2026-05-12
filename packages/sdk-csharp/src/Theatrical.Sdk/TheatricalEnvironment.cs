namespace Theatrical.Sdk;

public enum TheatricalEnvironment
{
    Sandbox,
    Staging,
    Production,
    Mock
}

internal static class TheatricalEnvironmentExtensions
{
    private static readonly Dictionary<TheatricalEnvironment, string> BaseUrls = new()
    {
        [TheatricalEnvironment.Sandbox] = "https://api-sandbox.vista.co",
        [TheatricalEnvironment.Staging] = "https://api-staging.vista.co",
        [TheatricalEnvironment.Production] = "https://api.vista.co",
        [TheatricalEnvironment.Mock] = "https://mock.theatrical.dev",
    };

    public static string GetBaseUrl(this TheatricalEnvironment env)
    {
        return BaseUrls.TryGetValue(env, out var url)
            ? url
            : throw new ArgumentOutOfRangeException(nameof(env), env, "Unknown environment");
    }
}
