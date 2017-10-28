using System;
using WebSocketSharp.Server;
using System.Net;
using System.Configuration;
using System.Diagnostics;
using System.Reflection;

namespace PlayerDataDump.StandAlone
{
    public class PlayerDataDump
    {
        public WebSocketServer Wss = new WebSocketServer(11420);
        public static string Version = FileVersionInfo.GetVersionInfo(Assembly.GetAssembly(typeof(PlayerDataDump)).Location).FileVersion;
        public static string Current;

        public string GetCurrentVersion()
        {
            try
            {
                WebClient web = new WebClient
                {
                    Headers =
                    {
                        [HttpRequestHeader.UserAgent] =
                        "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.2 (KHTML, like Gecko) Chrome/15.0.874.121 Safari/535.2"
                    }
                };

                return web.DownloadString("https://iamwyza.github.io/HollowKnightRandomizerTracker/version.txt");  
            } catch {
                return Version;
            }
        }

        public string GetVersion()
        {
            if (Current == null)
                Current = GetCurrentVersion();
            if ( Current == Version )
                return Version;
            return Version + " | UPDATE REQUIRED";
        }

        public void Initialize()
        {
            Console.WriteLine("Initializing PlayerDataDump");

            //Setup websockets server
            Wss.AddWebSocketService<SocketServer>("/playerData",(ss) => {
                ss.Init(ConfigurationManager.AppSettings["SavePath"]);
            });

            Wss.AddWebSocketService<ProfileStorageServer>("/ProfileStorage", (ss) => {
                ss.Init(ConfigurationManager.AppSettings["SavePath"]);
                }
            );

            Wss.Start();

            Console.WriteLine("Initialized PlayerDataDump");
        }
    }
}
