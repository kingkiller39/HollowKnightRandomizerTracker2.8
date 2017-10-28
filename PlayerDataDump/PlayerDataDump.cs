using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Modding;
using WebSocketSharp.Server;
using System.Net;
using System.Reflection;

namespace PlayerDataDump
{

    /// <summary>
    /// Main mod class for PlayerDataDump.  Provides the server and version handling.
    /// </summary>
    public class PlayerDataDump : Mod
    {
        public WebSocketServer Wss = new WebSocketServer(11420);

        public static string Version = FileVersionInfo.GetVersionInfo(Assembly.GetAssembly(typeof(PlayerDataDump)).Location).FileVersion;
        public static string Current;

        /// <summary>
        /// Fetches the list of the current mods installed.
        /// </summary>
        public static string GetCurrentMods()
        {
            List<string> mods = ModHooks.Instance.loadedMods;
            string output = mods.Aggregate("[", (current, mod) => current + $"\"{mod}\",");
            output = output.TrimEnd(',') + "]";
            return output;
        }

        /// <summary>
        /// Fetches current version from the site
        /// </summary>
        /// <returns>Version #</returns>
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
                    },
                    
                };
                
                return web.DownloadString("https://iamwyza.github.io/HollowKnightRandomizerTracker/version.txt");  
            } catch(Exception e) {
                ModHooks.ModLog(e.ToString());
                return Version;
            }
        }

        /// <summary>
        /// Fetches and compares the compiled version with the version from the site.
        /// </summary>
        /// <returns>Returns the current version.  Includes additional text if the current version doesn't match the version of the site.</returns>
        public override string GetVersion()
        {
            if (Current == null)
                Current = GetCurrentVersion();
            if ( Current == Version )
                return Version;
            return Version + " | UPDATE REQUIRED";
        }

        /// <summary>
        /// Creates and starts the WebSocket Server instances.
        /// </summary>
        public override void Initialize()
        {
            ModHooks.ModLog("Initializing PlayerDataDump");

            //Setup websockets server
            Wss.AddWebSocketService<SocketServer>("/playerData", ss =>
            {
                ModHooks.Instance.NewGameHook += ss.NewGame;
                ModHooks.Instance.SavegameLoadHook += ss.LoadSave;
                ModHooks.Instance.SetPlayerBoolHook += ss.EchoBool;
                ModHooks.Instance.SetPlayerIntHook += ss.EchoInt;

                ModHooks.Instance.ApplicationQuitHook += ss.OnQuit;
            });
            
            //Setup ProfileStorage Server
            Wss.AddWebSocketService<ProfileStorageServer>("/ProfileStorage", ss => { });

            Wss.Start();

            ModHooks.ModLog("Initialized PlayerDataDump");
        }
    }
}
