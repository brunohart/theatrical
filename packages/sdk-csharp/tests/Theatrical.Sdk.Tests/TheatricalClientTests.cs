using Xunit;

namespace Theatrical.Sdk.Tests;

public class TheatricalClientTests : IDisposable
{
    public void Dispose()
    {
        TheatricalClient.ResetGlobal();
    }

    [Fact]
    public void Create_WithValidOptions_ReturnsClientWithAllResources()
    {
        using var client = TheatricalClient.Create(new TheatricalClientOptions
        {
            ApiKey = "test-api-key",
            Environment = TheatricalEnvironment.Sandbox,
        });

        Assert.NotNull(client);
        Assert.NotNull(client.Sessions);
        Assert.NotNull(client.Sites);
        Assert.NotNull(client.Films);
        Assert.NotNull(client.Orders);
        Assert.NotNull(client.Loyalty);
        Assert.NotNull(client.Subscriptions);
        Assert.NotNull(client.Pricing);
        Assert.NotNull(client.FoodAndBeverage);
    }

    [Fact]
    public void Create_WithNullOptions_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => TheatricalClient.Create(null!));
    }

    [Fact]
    public void Create_WithEmptyApiKey_ThrowsValidationException()
    {
        Assert.Throws<Errors.ValidationException>(() =>
            TheatricalClient.Create(new TheatricalClientOptions { ApiKey = "" }));
    }

    [Fact]
    public void Create_WithInvalidTimeout_ThrowsValidationException()
    {
        Assert.Throws<Errors.ValidationException>(() =>
            TheatricalClient.Create(new TheatricalClientOptions
            {
                ApiKey = "valid-key",
                Timeout = TimeSpan.FromSeconds(200),
            }));
    }

    [Fact]
    public void Create_WithInvalidMaxRetries_ThrowsValidationException()
    {
        Assert.Throws<Errors.ValidationException>(() =>
            TheatricalClient.Create(new TheatricalClientOptions
            {
                ApiKey = "valid-key",
                MaxRetries = 99,
            }));
    }

    [Fact]
    public void CreateMock_ReturnsClient()
    {
        using var client = TheatricalClient.CreateMock();
        Assert.NotNull(client);
    }

    [Fact]
    public void Global_WithoutSetGlobal_ThrowsInvalidOperationException()
    {
        Assert.Throws<InvalidOperationException>(() => TheatricalClient.Global());
    }

    [Fact]
    public void SetGlobal_ThenGlobal_ReturnsSameInstance()
    {
        TheatricalClient.SetGlobal(new TheatricalClientOptions
        {
            ApiKey = "global-key",
            Environment = TheatricalEnvironment.Production,
        });

        var a = TheatricalClient.Global();
        var b = TheatricalClient.Global();

        Assert.Same(a, b);
    }

    [Fact]
    public void ResetGlobal_ClearsInstance()
    {
        TheatricalClient.SetGlobal(new TheatricalClientOptions { ApiKey = "key" });
        TheatricalClient.ResetGlobal();

        Assert.Throws<InvalidOperationException>(() => TheatricalClient.Global());
    }

    [Fact]
    public void LazyResourceInit_ReturnsSameInstanceOnMultipleAccesses()
    {
        using var client = TheatricalClient.Create(new TheatricalClientOptions
        {
            ApiKey = "test-key",
        });

        var sessions1 = client.Sessions;
        var sessions2 = client.Sessions;

        Assert.Same(sessions1, sessions2);
    }
}
