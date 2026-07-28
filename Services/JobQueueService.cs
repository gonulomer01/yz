using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace yz.Services
{
    public class JobStatusInfo
    {
        public string JobId { get; set; } = "";
        public int UserId { get; set; }
        public string Status { get; set; } = "Beklemede"; // "Beklemede", "Üretiliyor", "Tamamlandı", "İptal Edildi", "Hata"
        public int Position { get; set; }
        public object? Result { get; set; }
        public int RequiredSlots { get; set; } = 1;
        public int AcquiredSlots { get; set; } = 0;
        public CancellationTokenSource Cts { get; set; } = new CancellationTokenSource();
    }

    public class JobQueueService
    {
        private readonly SemaphoreSlim _concurrencySemaphore;
        private readonly ConcurrentDictionary<string, JobStatusInfo> _jobs = new();
        private readonly List<string> _waitingQueue = new();
        private readonly object _queueLock = new object();
        private readonly int _maxConcurrent;

        // Sunucunun gücüne göre aynı anda çalışabilecek Max üretim sayısı.
        public JobQueueService(int maxConcurrent = 6)
        {
            _maxConcurrent = maxConcurrent;
            _concurrencySemaphore = new SemaphoreSlim(maxConcurrent, maxConcurrent);
        }

        public JobStatusInfo EnqueueJob(int userId, int requiredSlots = 1)
        {
            var jobId = Guid.NewGuid().ToString("N");
            var job = new JobStatusInfo
            {
                JobId = jobId,
                UserId = userId,
                Status = "Beklemede",
                RequiredSlots = requiredSlots
            };
            
            _jobs[jobId] = job;
            
            lock (_queueLock)
            {
                _waitingQueue.Add(jobId);
                UpdatePositions();
            }
            
            return job;
        }

        public async Task<bool> TryWaitInQueueAsync(string jobId, int timeoutMs)
        {
            if (!_jobs.TryGetValue(jobId, out var job)) return false;
            
            try
            {
                for (int i = 0; i < job.RequiredSlots; i++)
                {
                    if (job.Cts.Token.IsCancellationRequested)
                        throw new OperationCanceledException();

                    bool acquired = await _concurrencySemaphore.WaitAsync(timeoutMs, job.Cts.Token);
                    if (acquired)
                    {
                        job.AcquiredSlots++;
                    }
                    else
                    {
                        return false;
                    }
                }

                lock (_queueLock)
                {
                    _waitingQueue.Remove(jobId);
                    UpdatePositions();
                }
                
                if (job.Status != "İptal Edildi")
                {
                    job.Status = "Üretiliyor";
                }
                else
                {
                    ReleaseSlot(jobId);
                }
                return true;
            }
            catch (OperationCanceledException)
            {
                lock (_queueLock)
                {
                    _waitingQueue.Remove(jobId);
                    UpdatePositions();
                }
                job.Status = "İptal Edildi";
                ReleaseSlot(jobId);
                throw;
            }
        }

        public async Task WaitInQueueAsync(string jobId)
        {
            await TryWaitInQueueAsync(jobId, Timeout.Infinite);
        }
        
        public void ReleaseSlot(string jobId)
        {
            if (_jobs.TryGetValue(jobId, out var job))
            {
                int slotsToRelease = job.AcquiredSlots;
                job.AcquiredSlots = 0; // Prevent double release
                
                for (int i = 0; i < slotsToRelease; i++)
                {
                    try
                    {
                        if (_concurrencySemaphore.CurrentCount < _maxConcurrent)
                        {
                            _concurrencySemaphore.Release();
                        }
                    }
                    catch (SemaphoreFullException)
                    {
                        // Zaten maksimum kapasitede, güvenle yoksay
                    }
                }
            }
        }

        public JobStatusInfo? GetStatus(string jobId)
        {
            if (_jobs.TryGetValue(jobId, out var job))
            {
                return job;
            }
            return null;
        }

        public void CompleteJob(string jobId, object? result = null, string? error = null)
        {
            if (_jobs.TryGetValue(jobId, out var job))
            {
                if (error != null)
                {
                    job.Status = "Hata";
                    job.Result = new { error };
                }
                else
                {
                    job.Status = "Tamamlandı";
                    job.Result = result;
                }
                
                // 5 dakika sonra job'ı bellekten temizle
                _ = Task.Run(async () =>
                {
                    await Task.Delay(TimeSpan.FromMinutes(5));
                    if (_jobs.TryRemove(jobId, out var removedJob))
                    {
                        try { removedJob.Cts.Dispose(); } catch { }
                    }
                });
            }
        }

        public bool CancelJob(string jobId, int currentUserId = 0, bool isAdmin = false)
        {
            if (_jobs.TryGetValue(jobId, out var job))
            {
                if (!isAdmin && currentUserId > 0 && job.UserId != currentUserId)
                    return false; // Yetkisiz

                job.Status = "İptal Edildi";
                job.Result = new { error = "Kullanıcı tarafından iptal edildi." };
                
                if (!job.Cts.IsCancellationRequested)
                {
                    job.Cts.Cancel();
                }
                
                // İptal edilen job'ı bekleme kuyruğundan da kaldır
                lock (_queueLock)
                {
                    _waitingQueue.Remove(jobId);
                    UpdatePositions();
                }
                
                // 5 dakika sonra job'ı bellekten temizle
                _ = Task.Run(async () =>
                {
                    await Task.Delay(TimeSpan.FromMinutes(5));
                    if (_jobs.TryRemove(jobId, out var removedJob))
                    {
                        try { removedJob.Cts.Dispose(); } catch { }
                    }
                });
                return true;
            }
            return false;
        }

        private void UpdatePositions()
        {
            for (int i = 0; i < _waitingQueue.Count; i++)
            {
                if (_jobs.TryGetValue(_waitingQueue[i], out var job))
                {
                    job.Position = i + 1;
                }
            }
        }
    }
}
