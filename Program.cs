using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using yz.Data;
using yz.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=SegmindNexusDb;Trusted_Connection=True;MultipleActiveResultSets=true"));

builder.Services.AddHttpClient();
builder.Services.AddSingleton<ImageSyncService>();
builder.Services.AddScoped<AiCredentialsService>();
builder.Services.AddScoped<AiGenerationService>();
builder.Services.AddScoped<MultiAiSeleniumService>();
builder.Services.AddScoped<GeminiSeleniumService>();

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Account/Login";
        options.LogoutPath = "/Account/Logout";
        options.AccessDeniedPath = "/Account/Login";
        options.Cookie.Name = "MelikgaziYZ.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.SlidingExpiration = true;
    });

builder.Services.AddAuthorization();
builder.Services.AddControllersWithViews();

var app = builder.Build();

app.InitializeDatabase();

var imageSyncService = app.Services.GetRequiredService<ImageSyncService>();
imageSyncService.SyncImagesOnStartup();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}

app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
