using Theatrical.Sdk.Errors;
using Xunit;

namespace Theatrical.Sdk.Tests.Errors;

public class VistaErrorCodesTests
{
    [Fact]
    public void ResolveMessage_KnownCode_ReturnsHumanReadable()
    {
        var msg = VistaErrorCodes.ResolveMessage("AUTH_TOKEN_EXPIRED", "fallback");
        Assert.Equal("Your access token has expired. Re-authenticate and retry.", msg);
    }

    [Fact]
    public void ResolveMessage_UnknownCode_ReturnsFallback()
    {
        var msg = VistaErrorCodes.ResolveMessage("UNKNOWN_CODE_XYZ", "my fallback");
        Assert.Equal("my fallback", msg);
    }

    [Fact]
    public void ResolveMessage_NullCode_ReturnsFallback()
    {
        var msg = VistaErrorCodes.ResolveMessage(null, "fallback");
        Assert.Equal("fallback", msg);
    }

    [Theory]
    [InlineData(VistaErrorCodes.SessionNotFound)]
    [InlineData(VistaErrorCodes.FilmNotFound)]
    [InlineData(VistaErrorCodes.OrderNotFound)]
    [InlineData(VistaErrorCodes.RateLimitExceeded)]
    [InlineData(VistaErrorCodes.InternalError)]
    public void ResolveMessage_AllDefinedCodes_HaveMessages(string code)
    {
        var msg = VistaErrorCodes.ResolveMessage(code, "should-not-see-this");
        Assert.NotEqual("should-not-see-this", msg);
    }
}
