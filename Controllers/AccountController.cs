using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using yz.Data;
using yz.Models;
namespace yz.Controllers
{
    public class AccountController : Controller
    {
        private readonly ApplicationDbContext _context;
        public AccountController(ApplicationDbContext context)
        {
            _context = context;
        }
        [HttpGet]
        public IActionResult Login(string? returnUrl = null)
        {
            if (User.Identity?.IsAuthenticated == true)
                return RedirectToAction("Index", "Home");
            ViewBag.ReturnUrl = returnUrl;
            ViewBag.Error = TempData["Error"];
            return View();
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(string username, string password, string? returnUrl = null)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                TempData["Error"] = "Kullanıcı adı ve şifre gereklidir.";
                return RedirectToAction("Login");
            }
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username.Trim().ToLower());
            if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            {
                TempData["Error"] = "Kullanıcı adı veya şifre hatalı.";
                return RedirectToAction("Login");
            }
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim("DisplayName", user.DisplayName),
                new Claim(ClaimTypes.Role, user.Role)
            };
            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var principal = new ClaimsPrincipal(identity);
            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal,
                new AuthenticationProperties
                {
                    IsPersistent = true,
                    ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7)
                });
            if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                return Redirect(returnUrl);
            return RedirectToAction("Index", "Home");
        }
        [HttpGet]
        public IActionResult Register()
        {
            if (User.Identity?.IsAuthenticated == true)
                return RedirectToAction("Index", "Home");
            ViewBag.Error = TempData["Error"];
            ViewBag.Success = TempData["Success"];
            return View();
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(string username, string displayName, string password, string passwordConfirm)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                TempData["Error"] = "Kullanıcı adı ve şifre gereklidir.";
                return RedirectToAction("Register");
            }
            if (password != passwordConfirm)
            {
                TempData["Error"] = "Şifreler eşleşmiyor.";
                return RedirectToAction("Register");
            }
            if (password.Length < 4)
            {
                TempData["Error"] = "Şifre en az 4 karakter olmalıdır.";
                return RedirectToAction("Register");
            }
            string cleanUsername = username.Trim().ToLower();
            var exists = await _context.Users.AnyAsync(u => u.Username == cleanUsername);
            if (exists)
            {
                TempData["Error"] = "Bu kullanıcı adı zaten kullanılıyor.";
                return RedirectToAction("Register");
            }
            var user = new User
            {
                Username = cleanUsername,
                DisplayName = string.IsNullOrWhiteSpace(displayName) ? cleanUsername : displayName.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                Role = "Kullanıcı",
                CreatedAt = DateTime.Now
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            TempData["Success"] = "Hesabınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.";
            return RedirectToAction("Login");
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Login");
        }
    }
}