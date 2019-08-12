using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Modding;
using WebSocketSharp.Server;
using System.Reflection;

namespace PlayerDataDump
{

    /// <summary>
    /// Main mod class for PlayerDataDump.  Provides the server and version handling.
    /// </summary>
    public class PlayerDataDump : Mod, ITogglableMod
    {
        public override int LoadPriority() => 9999;
        private readonly WebSocketServer _wss = new WebSocketServer(11420);
        internal static PlayerDataDump Instance;

        /// <summary>
        /// Fetches the list of the current mods installed.
        /// </summary>
        public static string GetCurrentMods()
        {
            List<string> mods = ModHooks.Instance.LoadedMods;
            string output = mods.Aggregate("[", (current, mod) => current + $"\"{mod}\",");
            output = output.TrimEnd(',') + "]";
            return output;
        }
        public override bool IsCurrent() {return true;}
        public override string GetVersion() => FileVersionInfo.GetVersionInfo(Assembly.GetAssembly(typeof(PlayerDataDump)).Location).FileVersion;
        /// <summary>
        /// Creates and starts the WebSocket Server instances.
        /// </summary>
        public override void Initialize()
        {
            Instance = this;
            Log("Initializing PlayerDataDump");

            //Setup websockets server
            _wss.AddWebSocketService<SocketServer>("/playerData", ss =>
            {
                ModHooks.Instance.NewGameHook += ss.NewGame;
                ModHooks.Instance.SavegameLoadHook += ss.LoadSave;

                ModHooks.Instance.SetPlayerBoolHook += ss.EchoBool;
                ModHooks.Instance.SetPlayerIntHook += ss.EchoInt;

                ModHooks.Instance.ApplicationQuitHook += ss.OnQuit;
            });
            
            //Setup ProfileStorage Server
            _wss.AddWebSocketService<ProfileStorageServer>("/ProfileStorage", ss => { });

            _wss.Start();

            Log("Initialized PlayerDataDump");
        }

        /// <summary>
        /// Called when the mod is disabled, stops the web socket server and removes the socket services.
        /// </summary>
        public void Unload()
        {
            _wss.Stop();
            _wss.RemoveWebSocketService("/playerData");
            _wss.RemoveWebSocketService("/ProfileStorage");
        }
    }
}
