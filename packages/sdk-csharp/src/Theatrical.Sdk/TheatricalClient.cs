using Theatrical.Sdk.Auth;
using Theatrical.Sdk.Http;
using Theatrical.Sdk.Mock;
using Theatrical.Sdk.Resources;

namespace Theatrical.Sdk;

public sealed class TheatricalClient : IDisposable
{
    private readonly TheatricalClientOptions _options;
    private readonly ITheatricalHttpClient _httpClient;
    private readonly TokenManager? _tokenManager;
    private readonly GasClient? _gasClient;
    private bool _disposed;

    private readonly Lazy<SessionsResource> _sessions;
    private readonly Lazy<SitesResource> _sites;
    private readonly Lazy<FilmsResource> _films;
    private readonly Lazy<OrdersResource> _orders;
    private readonly Lazy<LoyaltyResource> _loyalty;
    private readonly Lazy<SubscriptionsResource> _subscriptions;
    private readonly Lazy<PricingResource> _pricing;
    private readonly Lazy<FoodAndBeverageResource> _fnb;

    private static TheatricalClient? _globalInstance;
    private static readonly object GlobalLock = new();

    private TheatricalClient(TheatricalClientOptions options, ITheatricalHttpClient httpClient, TokenManager? tokenManager, GasClient? gasClient)
    {
        _options = options;
        _httpClient = httpClient;
        _tokenManager = tokenManager;
        _gasClient = gasClient;

        _sessions = new Lazy<SessionsResource>(() => new SessionsResource(_httpClient));
        _sites = new Lazy<SitesResource>(() => new SitesResource(_httpClient));
        _films = new Lazy<FilmsResource>(() => new FilmsResource(_httpClient));
        _orders = new Lazy<OrdersResource>(() => new OrdersResource(_httpClient));
        _loyalty = new Lazy<LoyaltyResource>(() => new LoyaltyResource(_httpClient));
        _subscriptions = new Lazy<SubscriptionsResource>(() => new SubscriptionsResource(_httpClient));
        _pricing = new Lazy<PricingResource>(() => new PricingResource(_httpClient));
        _fnb = new Lazy<FoodAndBeverageResource>(() => new FoodAndBeverageResource(_httpClient));
    }

    public static TheatricalClient Create(TheatricalClientOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        options.Validate();

        var gasClient = new GasClient(options.ApiKey);
        var tokenManager = new TokenManager(gasClient);
        var rateLimiter = new RateLimiter();
        var retryConfig = new RetryConfig { MaxRetries = options.MaxRetries };

        var httpClient = new TheatricalHttpClient(
            options.ResolvedBaseUrl,
            options.Timeout,
            tokenManager,
            retryConfig,
            rateLimiter,
            options.Debug);

        return new TheatricalClient(options, httpClient, tokenManager, gasClient);
    }

    public static TheatricalClient CreateMock()
    {
        var options = new TheatricalClientOptions
        {
            ApiKey = "mock-api-key",
            Environment = TheatricalEnvironment.Mock,
            Debug = false,
        };

        return new TheatricalClient(options, new MockHttpAdapter(), tokenManager: null, gasClient: null);
    }

    public static TheatricalClient Global()
    {
        lock (GlobalLock)
        {
            return _globalInstance
                ?? throw new InvalidOperationException(
                    "No global TheatricalClient configured. Call TheatricalClient.SetGlobal(options) first.");
        }
    }

    public static void SetGlobal(TheatricalClientOptions options)
    {
        lock (GlobalLock)
        {
            var previous = _globalInstance;
            _globalInstance = Create(options);
            previous?.Dispose();
        }
    }

    public static void ResetGlobal()
    {
        lock (GlobalLock)
        {
            _globalInstance?.Dispose();
            _globalInstance = null;
        }
    }

    public SessionsResource Sessions { get { ThrowIfDisposed(); return _sessions.Value; } }
    public SitesResource Sites { get { ThrowIfDisposed(); return _sites.Value; } }
    public FilmsResource Films { get { ThrowIfDisposed(); return _films.Value; } }
    public OrdersResource Orders { get { ThrowIfDisposed(); return _orders.Value; } }
    public LoyaltyResource Loyalty { get { ThrowIfDisposed(); return _loyalty.Value; } }
    public SubscriptionsResource Subscriptions { get { ThrowIfDisposed(); return _subscriptions.Value; } }
    public PricingResource Pricing { get { ThrowIfDisposed(); return _pricing.Value; } }
    public FoodAndBeverageResource FoodAndBeverage { get { ThrowIfDisposed(); return _fnb.Value; } }

    private void ThrowIfDisposed()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            (_httpClient as IDisposable)?.Dispose();
            _tokenManager?.Dispose();
            _gasClient?.Dispose();
            _disposed = true;
        }
    }
}
