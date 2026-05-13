using System.Net;
using System.Text;
using Theatrical.Sdk.Errors;
using Xunit;

namespace Theatrical.Sdk.Tests.Errors;

public class ErrorParserTests
{
    [Fact]
    public async Task ParseResponse_401_ReturnsAuthenticationException()
    {
        var response = CreateResponse(HttpStatusCode.Unauthorized,
            """{"code":"AUTH_TOKEN_EXPIRED","message":"Token expired"}""");

        var ex = await ErrorParser.ParseResponseAsync(response);

        Assert.IsType<AuthenticationException>(ex);
        Assert.Equal(401, ex.StatusCode);
        Assert.Equal("AUTH_TOKEN_EXPIRED", ex.VistaErrorCode);
    }

    [Fact]
    public async Task ParseResponse_403_ReturnsAuthenticationException()
    {
        var response = CreateResponse(HttpStatusCode.Forbidden,
            """{"code":"AUTH_INSUFFICIENT_SCOPE"}""");

        var ex = await ErrorParser.ParseResponseAsync(response);

        Assert.IsType<AuthenticationException>(ex);
        Assert.Equal(401, ex.StatusCode);
    }

    [Fact]
    public async Task ParseResponse_429_ReturnsRateLimitExceptionWithRetryAfter()
    {
        var response = CreateResponse(HttpStatusCode.TooManyRequests, "{}");
        response.Headers.Add("Retry-After", "30");

        var ex = await ErrorParser.ParseResponseAsync(response);

        var rle = Assert.IsType<RateLimitException>(ex);
        Assert.Equal(TimeSpan.FromSeconds(30), rle.RetryAfter);
    }

    [Fact]
    public async Task ParseResponse_429_DefaultsTo60Seconds()
    {
        var response = CreateResponse(HttpStatusCode.TooManyRequests, "{}");

        var ex = await ErrorParser.ParseResponseAsync(response);

        var rle = Assert.IsType<RateLimitException>(ex);
        Assert.Equal(TimeSpan.FromSeconds(60), rle.RetryAfter);
    }

    [Fact]
    public async Task ParseResponse_400_ReturnsValidationExceptionWithFieldErrors()
    {
        var response = CreateResponse(HttpStatusCode.BadRequest,
            """{"message":"Validation failed","errors":[{"field":"email","message":"invalid format"},{"field":"siteId","message":"required"}]}""");

        var ex = await ErrorParser.ParseResponseAsync(response);

        var ve = Assert.IsType<ValidationException>(ex);
        Assert.Equal("invalid format", ve.Fields["email"]);
        Assert.Equal("required", ve.Fields["siteId"]);
    }

    [Fact]
    public async Task ParseResponse_422_ReturnsValidationException()
    {
        var response = CreateResponse((HttpStatusCode)422, """{"message":"Invalid entity"}""");

        var ex = await ErrorParser.ParseResponseAsync(response);

        Assert.IsType<ValidationException>(ex);
    }

    [Fact]
    public async Task ParseResponse_404_ReturnsNotFoundWithResourceFromVistaCode()
    {
        var response = CreateResponse(HttpStatusCode.NotFound,
            """{"code":"SESSION_NOT_FOUND"}""");

        var ex = await ErrorParser.ParseResponseAsync(response,
            "https://api.vista.co/ocapi/v1/sessions/ses-123");

        var nf = Assert.IsType<NotFoundException>(ex);
        Assert.Equal("Session", nf.Resource);
        Assert.Equal("ses-123", nf.ResourceId);
    }

    [Fact]
    public async Task ParseResponse_404_InfersResourceFromUrl()
    {
        var response = CreateResponse(HttpStatusCode.NotFound, "{}");

        var ex = await ErrorParser.ParseResponseAsync(response,
            "https://api.vista.co/ocapi/v1/films/film-456");

        var nf = Assert.IsType<NotFoundException>(ex);
        Assert.Equal("Film", nf.Resource);
    }

    [Fact]
    public async Task ParseResponse_500_ReturnsServerException()
    {
        var response = CreateResponse(HttpStatusCode.InternalServerError,
            """{"code":"INTERNAL_ERROR","requestId":"req-500"}""");

        var ex = await ErrorParser.ParseResponseAsync(response);

        Assert.IsType<ServerException>(ex);
        Assert.Equal("req-500", ex.RequestId);
    }

    [Fact]
    public async Task ParseResponse_502_ReturnsServerException()
    {
        var response = CreateResponse(HttpStatusCode.BadGateway, "");

        var ex = await ErrorParser.ParseResponseAsync(response);

        Assert.IsType<ServerException>(ex);
    }

    [Fact]
    public async Task ParseResponse_OcapiFaultFormat_ExtractsVistaCode()
    {
        var response = CreateResponse(HttpStatusCode.InternalServerError,
            """{"fault":{"type":"UPSTREAM_TIMEOUT","message":"Upstream down"}}""");

        var ex = await ErrorParser.ParseResponseAsync(response);

        Assert.IsType<ServerException>(ex);
        Assert.Equal("UPSTREAM_TIMEOUT", ex.VistaErrorCode);
    }

    [Fact]
    public async Task ParseResponse_EmptyBody_FallsBackToStatusMessage()
    {
        var response = CreateResponse(HttpStatusCode.InternalServerError, "");

        var ex = await ErrorParser.ParseResponseAsync(response);

        Assert.Contains("500", ex.Message);
    }

    [Fact]
    public async Task ParseResponse_InvalidJson_FallsBackGracefully()
    {
        var response = CreateResponse(HttpStatusCode.BadRequest, "not json at all");

        var ex = await ErrorParser.ParseResponseAsync(response);

        Assert.IsType<ValidationException>(ex);
    }

    [Fact]
    public async Task ParseResponse_UnknownStatus418_ReturnsBaseException()
    {
        var response = CreateResponse((HttpStatusCode)418, """{"message":"I'm a teapot"}""");

        var ex = await ErrorParser.ParseResponseAsync(response);

        Assert.IsType<TheatricalException>(ex);
        Assert.Equal(418, ex.StatusCode);
    }

    private static HttpResponseMessage CreateResponse(HttpStatusCode status, string body)
    {
        return new HttpResponseMessage(status)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        };
    }
}
