#nullable enable
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;

namespace HKTracker
{
    /// Loosely based on
    /// https://github.com/nike4613/BeatSaber-IPA-Reloaded/blob/145879a186f99170142886b7ed04f5660fada830/IPA.Loader/Utilities/Async/UnityMainThreadTaskScheduler.cs
    internal class UnityMainThreadTaskScheduler : TaskScheduler, IDisposable
    {
        public readonly TaskFactory Factory;

        private class SchedulerComponent : MonoBehaviour
        {
            internal UnityMainThreadTaskScheduler? outer;

            void Awake()
            {
                DontDestroyOnLoad(this);
            }

            void Update()
            {
                while (outer!.tasks.TryDequeue(out QueueItem task))
                {
                    if (task.Task is not null)
                    {
                        outer.TryExecuteTask(task.Task);
                    }
                }
            }
        }

        private readonly Thread mainThread;
        private readonly GameObject gameObject;

        private readonly ConcurrentQueue<QueueItem> tasks = new();
        private static readonly ConditionalWeakTable<Task, QueueItem> itemTable = new();

        private class QueueItem
        {
            public Task? Task;

            public QueueItem(Task task)
            {
                Task = task;
            }
        }

        /// <summary>
        /// Needs to be instantiated on the main game thread.
        /// </summary>
        public UnityMainThreadTaskScheduler()
        {
            mainThread = Thread.CurrentThread;
            gameObject = new GameObject("HKTracker_UnityMainThreadTaskScheduler");
            gameObject.AddComponent<SchedulerComponent>().outer = this;
            Factory = new TaskFactory(this);
        }

        protected override IEnumerable<Task> GetScheduledTasks()
            => tasks.ToArray().Where(q => q.Task is not null).Select(q => q.Task!).ToArray();

        protected override void QueueTask(Task task)
        {
            ThrowIfDisposed();

            var item = new QueueItem(task);
            itemTable.Add(task, item);
            tasks.Enqueue(item);
        }

        protected override bool TryExecuteTaskInline(Task task, bool taskWasPreviouslyQueued)
        {
            ThrowIfDisposed();

            if (!mainThread.Equals(Thread.CurrentThread))
            {
                return false;
            }
            if (taskWasPreviouslyQueued)
            {
                if (itemTable.TryGetValue(task, out var item))
                {
                    item.Task = null;
                }
                else return false;
            }
            return TryExecuteTask(task);
        }

        #region IDisposable Support
        private bool disposedValue;

        private void ThrowIfDisposed()
        {
            if (disposedValue)
                throw new ObjectDisposedException(nameof(UnityMainThreadTaskScheduler));
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!disposedValue)
            {
                UnityEngine.Object.Destroy(gameObject);
                disposedValue = true;
            }
        }

        public void Dispose()
        {
            // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
            Dispose(disposing: true);
        }
        #endregion
    }
}
