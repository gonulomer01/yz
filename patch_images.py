with open('Services/MultiAiSeleniumService.cs', 'r', encoding='utf-8') as f:
    code = f.read()

# For Gemini
old_gemini = """                  byte[]? imageBytes = null;
                  Console.WriteLine("[Gemini] Canvas ile orijinal g\u00f6rsel \u00e7ekiliyor...");
                  imageBytes = await ExtractImageViaCanvasAsync(driver, generatedImg);
                  if (imageBytes == null || imageBytes.Length < 1000)
                  {
                      Console.WriteLine("[Gemini] Canvas ba\u015far\u0131s\u0131z. URL tabanl\u0131 indirme deneniyor...");
                      string? src = generatedImg.GetAttribute("src");
                      if (!string.IsNullOrEmpty(src))
                      {
                          imageBytes = await DownloadOriginalImageAsync(driver, src);
                      }
                  }"""

new_gemini = """                  byte[]? imageBytes = null;
                  Console.WriteLine("[Gemini] Y\u00fcksek \u00e7\u00f6z\u00fcn\u00fcrl\u00fckl\u00fc URL tabanl\u0131 indirme deneniyor...");
                  string? src = generatedImg.GetAttribute("src");
                  if (!string.IsNullOrEmpty(src))
                  {
                      imageBytes = await DownloadOriginalImageAsync(driver, src);
                  }
                  if (imageBytes == null || imageBytes.Length < 1000)
                  {
                      Console.WriteLine("[Gemini] URL tabanl\u0131 indirme ba\u015far\u0131s\u0131z. Canvas ile g\u00f6rsel \u00e7ekiliyor...");
                      imageBytes = await ExtractImageViaCanvasAsync(driver, generatedImg);
                  }"""

code = code.replace(old_gemini, new_gemini)

# For ChatGPT
old_chatgpt = """                  byte[]? imageBytes = null;
                  Console.WriteLine("[ChatGPT] Canvas ile orijinal g\u00f6rsel \u00e7ekiliyor...");
                  imageBytes = await ExtractImageViaCanvasAsync(driver, generatedImg);
                  if (imageBytes == null || imageBytes.Length < 1000)
                  {
                      Console.WriteLine("[ChatGPT] Canvas ba\u015far\u0131s\u0131z. URL tabanl\u0131 indirme deneniyor...");
                      string? src = generatedImg.GetAttribute("src");
                      if (!string.IsNullOrEmpty(src) && !src.StartsWith("blob:"))
                      {
                          try
                          {
                              imageBytes = await _sharedHttpClient.GetByteArrayAsync(src);
                              Console.WriteLine($"[ChatGPT] HttpClient ile g\u00f6rsel indirildi. Boyut: {imageBytes.Length} byte.");
                          }
                          catch (Exception httpEx)
                          {
                              Console.WriteLine($"[ChatGPT] HttpClient ba\u015far\u0131s\u0131z: {httpEx.Message}");
                          }
                      }
                  }"""

new_chatgpt = """                  byte[]? imageBytes = null;
                  Console.WriteLine("[ChatGPT] URL tabanl\u0131 indirme deneniyor (Y\u00fcksek \u00e7\u00f6z\u00fcn\u00fcrl\u00fck \u00f6nceli\u011fi)...");
                  string? src = generatedImg.GetAttribute("src");
                  if (!string.IsNullOrEmpty(src) && !src.StartsWith("blob:"))
                  {
                      try
                      {
                          imageBytes = await _sharedHttpClient.GetByteArrayAsync(src);
                          Console.WriteLine($"[ChatGPT] HttpClient ile g\u00f6rsel indirildi. Boyut: {imageBytes.Length} byte.");
                      }
                      catch (Exception httpEx)
                      {
                          Console.WriteLine($"[ChatGPT] HttpClient ba\u015far\u0131s\u0131z: {httpEx.Message}");
                      }
                  }
                  if (imageBytes == null || imageBytes.Length < 1000)
                  {
                      Console.WriteLine("[ChatGPT] URL tabanl\u0131 indirme ba\u015far\u0131s\u0131z. Canvas ile orijinal g\u00f6rsel \u00e7ekiliyor...");
                      imageBytes = await ExtractImageViaCanvasAsync(driver, generatedImg);
                  }"""

code = code.replace(old_chatgpt, new_chatgpt)

# For Copilot
old_copilot = """                              if (imageBytes == null || imageBytes.Length < 1000)
                              {
                                  Console.WriteLine("[Copilot] B\u00fcy\u00fck resim bulundu, Canvas ile \u00e7ekiliyor...");
                                  imageBytes = await ExtractImageViaCanvasAsync(driver, largeImg);
                              }
                              if (imageBytes == null || imageBytes.Length < 1000)
                              {
                                  string? largeSrc = largeImg.GetAttribute("src");
                                  if (!string.IsNullOrEmpty(largeSrc))
                                  {
                                      if (largeSrc.Contains("th?id=OIG"))
                                      {
                                          int qIndex = largeSrc.IndexOf('?');
                                          if (qIndex > 0) largeSrc = largeSrc.Substring(0, qIndex); 
                                      }
                                      Console.WriteLine($"[Copilot] Canvas ba\u015far\u0131s\u0131z, orijinal URL indiriliyor: {largeSrc}");
                                      imageBytes = await DownloadOriginalImageAsync(driver, largeSrc);
                                  }
                              }"""

new_copilot = """                              if (imageBytes == null || imageBytes.Length < 1000)
                              {
                                  string? largeSrc = largeImg.GetAttribute("src");
                                  if (!string.IsNullOrEmpty(largeSrc))
                                  {
                                      if (largeSrc.Contains("th?id=OIG"))
                                      {
                                          int qIndex = largeSrc.IndexOf('?');
                                          if (qIndex > 0) largeSrc = largeSrc.Substring(0, qIndex); 
                                      }
                                      Console.WriteLine($"[Copilot] Orijinal URL \u00fczerinden y\u00fcksek \u00e7\u00f6z\u00fcn\u00fcrl\u00fckl\u00fc indiriliyor: {largeSrc}");
                                      imageBytes = await DownloadOriginalImageAsync(driver, largeSrc);
                                  }
                              }
                              if (imageBytes == null || imageBytes.Length < 1000)
                              {
                                  Console.WriteLine("[Copilot] URL \u00fczerinden indirme ba\u015far\u0131s\u0131z, Canvas ile \u00e7ekiliyor...");
                                  imageBytes = await ExtractImageViaCanvasAsync(driver, largeImg);
                              }"""

code = code.replace(old_copilot, new_copilot)

with open('Services/MultiAiSeleniumService.cs', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
