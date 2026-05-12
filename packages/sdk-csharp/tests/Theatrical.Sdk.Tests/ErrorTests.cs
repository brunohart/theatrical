using Theatrical.Sdk.Errors;
using Xunit;

namespace Theatrical.Sdk.Tests;

public class ErrorTests
{
    [Fact]
    public void TheatricalException_CarriesStatusCodeAndRequestId()
    {
        var ex = new TheatricalException("test error", 500, "VISTA_001", "req-123");

        Assert.Equal("test error", ex.Message);
        Assert.Equal(500, ex.StatusCode);
        Assert.Equal("VISTA_001", ex.VistaErrorCode);
        Assert.Equal("req-123", ex.RequestId);
    }

    [Fact]
    public void TheatricalException_ToJson_SerializesCorrectly()
    {
        var ex = new TheatricalException("test", 500, "CODE", "req-1");
        var json = ex.ToJson();

        Assert.Contains("\"statusCode\":500", json);
        Assert.Contains("\"vistaErrorCode\":\"CODE\"", json);
        Assert.Contains("\"requestId\":\"req-1\"", json);
    }

    [Fact]
    public void AuthenticationException_HasStatusCode401()
    {
        var ex = new AuthenticationException();
        Assert.Equal(401, ex.StatusCode);
        Assert.Equal("Authentication failed", ex.Message);
    }

    [Fact]
    public void RateLimitException_CarriesRetryAfter()
    {
        var ex = new RateLimitException(TimeSpan.FromSeconds(30), "req-429");

        Assert.Equal(429, ex.StatusCode);
        Assert.Equal(TimeSpan.FromSeconds(30), ex.RetryAfter);
        Assert.Contains("30", ex.Message);
    }

    [Fact]
    public void ValidationException_CarriesFieldErrors()
    {
        var fields = new Dictionary<string, string> { ["email"] = "invalid format" };
        var ex = new ValidationException("Validation failed", fields);

        Assert.Equal(400, ex.StatusCode);
        Assert.Equal("invalid format", ex.Fields["email"]);
    }

    [Fact]
    public void NotFoundException_CarriesResourceInfo()
    {
        var ex = new NotFoundException("Session", "ses-001", "req-404");

        Assert.Equal(404, ex.StatusCode);
        Assert.Equal("Session", ex.Resource);
        Assert.Equal("ses-001", ex.ResourceId);
        Assert.Contains("ses-001", ex.Message);
    }

    [Fact]
    public void ServerException_HasStatusCode500()
    {
        var ex = new ServerException();
        Assert.Equal(500, ex.StatusCode);
    }
}
