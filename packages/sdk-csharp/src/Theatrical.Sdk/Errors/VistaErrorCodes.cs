namespace Theatrical.Sdk.Errors;

public static class VistaErrorCodes
{
    public const string AuthTokenExpired = "AUTH_TOKEN_EXPIRED";
    public const string AuthTokenInvalid = "AUTH_TOKEN_INVALID";
    public const string AuthTokenMissing = "AUTH_TOKEN_MISSING";
    public const string AuthInsufficientScope = "AUTH_INSUFFICIENT_SCOPE";
    public const string AuthApiKeyInvalid = "AUTH_API_KEY_INVALID";

    public const string RateLimitExceeded = "RATE_LIMIT_EXCEEDED";
    public const string QuotaExceeded = "QUOTA_EXCEEDED";

    public const string ValidationFailed = "VALIDATION_FAILED";
    public const string InvalidParameter = "INVALID_PARAMETER";
    public const string MissingRequiredField = "MISSING_REQUIRED_FIELD";
    public const string InvalidDateFormat = "INVALID_DATE_FORMAT";
    public const string InvalidCurrency = "INVALID_CURRENCY";

    public const string SessionNotFound = "SESSION_NOT_FOUND";
    public const string SessionExpired = "SESSION_EXPIRED";
    public const string SessionSoldOut = "SESSION_SOLD_OUT";
    public const string SeatUnavailable = "SEAT_UNAVAILABLE";
    public const string FilmNotFound = "FILM_NOT_FOUND";
    public const string SiteNotFound = "SITE_NOT_FOUND";
    public const string OrderNotFound = "ORDER_NOT_FOUND";
    public const string OrderAlreadyConfirmed = "ORDER_ALREADY_CONFIRMED";
    public const string OrderCancellationWindowExpired = "ORDER_CANCELLATION_WINDOW_EXPIRED";
    public const string MemberNotFound = "MEMBER_NOT_FOUND";

    public const string InternalError = "INTERNAL_ERROR";
    public const string ServiceUnavailable = "SERVICE_UNAVAILABLE";
    public const string UpstreamTimeout = "UPSTREAM_TIMEOUT";

    private static readonly Dictionary<string, string> Messages = new()
    {
        [AuthTokenExpired] = "Your access token has expired. Re-authenticate and retry.",
        [AuthTokenInvalid] = "The provided access token is invalid.",
        [AuthTokenMissing] = "No access token was provided.",
        [AuthInsufficientScope] = "The access token does not have the required permissions.",
        [AuthApiKeyInvalid] = "The API key is invalid or has been revoked.",
        [RateLimitExceeded] = "Too many requests. Please slow down.",
        [QuotaExceeded] = "API quota exceeded for this billing period.",
        [ValidationFailed] = "One or more fields failed validation.",
        [InvalidParameter] = "A request parameter contains an invalid value.",
        [MissingRequiredField] = "A required field is missing from the request.",
        [InvalidDateFormat] = "Date must be in ISO 8601 format (YYYY-MM-DD).",
        [InvalidCurrency] = "Currency code must be a valid ISO 4217 code (e.g. NZD, AUD).",
        [SessionNotFound] = "The requested session does not exist.",
        [SessionExpired] = "This session has already passed.",
        [SessionSoldOut] = "This session is sold out.",
        [SeatUnavailable] = "One or more selected seats are no longer available.",
        [FilmNotFound] = "The requested film does not exist.",
        [SiteNotFound] = "The requested cinema site does not exist.",
        [OrderNotFound] = "The requested order does not exist.",
        [OrderAlreadyConfirmed] = "This order has already been confirmed.",
        [OrderCancellationWindowExpired] = "The cancellation window for this order has passed.",
        [MemberNotFound] = "The requested member does not exist.",
        [InternalError] = "An internal server error occurred. Please try again.",
        [ServiceUnavailable] = "The service is temporarily unavailable.",
        [UpstreamTimeout] = "The upstream service timed out.",
    };

    public static string ResolveMessage(string? code, string fallback)
    {
        if (code is null) return fallback;
        return Messages.GetValueOrDefault(code, fallback);
    }
}
