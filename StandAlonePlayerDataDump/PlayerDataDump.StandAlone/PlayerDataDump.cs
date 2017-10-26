using System;
using WebSocketSharp.Server;
using System.Net;
using System.Configuration;

namespace PlayerDataDump.StandAlone
{
    public class PlayerDataDump
    {
        public WebSocketServer wss = new WebSocketServer(11420);
        public static String version = "24/10/17.a";
        public static String current;

        public string GetCurrentVersion()
        {
            try
            {
                WebClient web = new WebClient();
                web.Headers[HttpRequestHeader.UserAgent] = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.2 (KHTML, like Gecko) Chrome/15.0.874.121 Safari/535.2";      
                return web.DownloadString("https://iamwyza.github.io/HollowKnightRandomizerTracker/version.txt");  
            } catch {
                return version;
            }
        }

        public string GetVersion()
        {
            if (current == null)
                current = GetCurrentVersion();
            if ( current == version )
                return version;
            return version + " | UPDATE REQUIRED";
        }

        public void Initialize()
        {
            Console.WriteLine("Initializing PlayerDataDump");

            //Setup websockets server
            wss.AddWebSocketService<SocketServer>("/playerData",(ss) => {
                ss.Init(ConfigurationManager.AppSettings["SavePath"]);
            });

            wss.AddWebSocketService<ProfileStorageServer>("/ProfileStorage", (ss) => {
                ss.Init(ConfigurationManager.AppSettings["SavePath"]);
                }
            );

            wss.Start();

            Console.WriteLine("Initialized PlayerDataDump");
        }
    }
}
