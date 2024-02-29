using System.Threading;
using System.Threading.Tasks;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace HKTracker
{
    internal abstract class QueuingWebSocketBehavior : WebSocketBehavior
    {
        private Task readyToWrite = Task.CompletedTask;
        private readonly CancellationTokenSource connectionClosed = new CancellationTokenSource();

        /// <summary>Queue data to send on the websocket in-order. This method is thread-safe and non-blocking.</summary>
        protected void QueuedSend(string data)
        {
            var promise = new TaskCompletionSource<object>();
            var oldReadyToWrite = Interlocked.Exchange(ref readyToWrite, promise.Task);
            oldReadyToWrite.ContinueWith(t =>
            {
                SendAsync(data, b =>
                {
                    promise.SetResult(null);
                });
            }, connectionClosed.Token, TaskContinuationOptions.ExecuteSynchronously, TaskScheduler.Default);
        }

        protected override void OnClose(CloseEventArgs e)
        {
            base.OnClose(e);
            connectionClosed.Cancel();
        }
    }
}