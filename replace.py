import re

with open('Controllers/ApiController.cs', 'r', encoding='utf-8') as f:
    content = f.read()

new_endpoint = '''
        public class GenerateTripleRequest
        {
            public string Prompt { get; set; } = "";
            public string AspectRatio { get; set; } = "1:1";
            public string Style { get; set; } = "none";
            public string TargetSite { get; set; } = "all";
        }

        public class TripleJobState
        {
            public string Type { get; set; } = "triple";
            public string GroupId { get; set; } = "";
            public string Prompt { get; set; } = "";
            public System.Collections.Generic.List<object> Progress { get; set; } = new();
            public System.Collections.Generic.List<object> Failures { get; set; } = new();
            public bool IsCompleted { get; set; } = false;
        }

        [HttpPost("generate-triple-job")]
        public IActionResult GenerateTripleJob([FromBody] GenerateTripleRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Prompt)) return BadRequest(new { error = "Prompt gerekli." });
            
            int currentUserId = GetCurrentUserId();
            bool isAdmin = User.IsInRole("Yönetici");
            string formattedPrompt = _aiGenerationService.FormatPrompt(req.Prompt, req.Style);
            string groupId = System.Guid.NewGuid().ToString("N").Substring(0, 12);

            var job = _jobQueueService.EnqueueJob(currentUserId);
            var state = new TripleJobState { GroupId = groupId, Prompt = req.Prompt };
            job.Result = state;

            _ = System.Threading.Tasks.Task.Run(async () =>
            {
                try
                {
                    await _jobQueueService.WaitInQueueAsync(job.JobId);
                    if (job.Status == "İptal Edildi") return;

                    MultiAiSeleniumService.CurrentCancellationToken.Value = job.Cts.Token;

                    var pending = new System.Collections.Generic.List<System.Threading.Tasks.Task<SiteGenerationResult>>();

                    if (req.TargetSite == "all" || req.TargetSite == "gemini")
                    {
                        pending.Add(System.Threading.Tasks.Task.Run(async () =>
                        {
                            using var scope = _scopeFactory.CreateScope();
                            var svc = scope.ServiceProvider.GetRequiredService<MultiAiSeleniumService>();
                            MultiAiSeleniumService.CurrentCancellationToken.Value = job.Cts.Token;
                            return await svc.GenerateSiteForTripleAsync("gemini", formattedPrompt, req.AspectRatio, currentUserId, isAdmin, groupId);
                        }));
                    }
                    
                    if (req.TargetSite == "all" || req.TargetSite == "chatgpt")
                    {
                        pending.Add(System.Threading.Tasks.Task.Run(async () =>
                        {
                            using var scope = _scopeFactory.CreateScope();
                            var svc = scope.ServiceProvider.GetRequiredService<MultiAiSeleniumService>();
                            MultiAiSeleniumService.CurrentCancellationToken.Value = job.Cts.Token;
                            return await svc.GenerateSiteForTripleAsync("chatgpt", formattedPrompt, req.AspectRatio, currentUserId, isAdmin, groupId);
                        }));
                    }

                    if (req.TargetSite == "all" || req.TargetSite == "copilot")
                    {
                        pending.Add(System.Threading.Tasks.Task.Run(async () =>
                        {
                            using var scope = _scopeFactory.CreateScope();
                            var svc = scope.ServiceProvider.GetRequiredService<MultiAiSeleniumService>();
                            MultiAiSeleniumService.CurrentCancellationToken.Value = job.Cts.Token;
                            return await svc.GenerateSiteForTripleAsync("copilot", formattedPrompt, req.AspectRatio, currentUserId, isAdmin, groupId);
                        }));
                    }

                    while (pending.Count > 0)
                    {
                        var completedTask = await System.Threading.Tasks.Task.WhenAny(pending);
                        pending.Remove(completedTask);

                        if (job.Cts.Token.IsCancellationRequested) break;

                        SiteGenerationResult result;
                        try { result = await completedTask; }
                        catch (System.Exception ex) { result = new SiteGenerationResult { Success = false, Error = ex.Message, SourceSite = "unknown" }; }

                        lock (state)
                        {
                            if (result.Success)
                            {
                                state.Progress.Add(new {
                                    site = result.SourceSite, status = "success", image = result.ImagePath,
                                    modelUsed = result.ModelUsed, keyUsedLabel = result.KeyUsedLabel, imageId = result.ImageId
                                });
                            }
                            else
                            {
                                state.Failures.Add(new { site = result.SourceSite, status = "failed", error = result.Error ?? "Üretim başarısız" });
                            }
                        }
                    }

                    lock (state) { state.IsCompleted = true; }
                    _jobQueueService.CompleteJob(job.JobId, state);
                }
                catch (System.OperationCanceledException)
                {
                    _jobQueueService.CompleteJob(job.JobId, error: "İşlem kullanıcı tarafından iptal edildi.");
                }
                catch (System.Exception ex)
                {
                    _jobQueueService.CompleteJob(job.JobId, error: ex.Message);
                }
                finally
                {
                    try { _jobQueueService.ReleaseSlot(); } catch { }
                }
            });

            return Ok(new { jobId = job.JobId, status = job.Status, position = job.Position });
        }
'''

pattern = r'\[HttpGet\("generate-triple-stream"\)\].*?(?=private static async Task WriteSseEventAsync)'
new_content = re.sub(pattern, new_endpoint + '\\n        ', content, flags=re.DOTALL)

with open('Controllers/ApiController.cs', 'w', encoding='utf-8') as f:
    f.write(new_content)
