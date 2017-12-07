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
    public class PlayerDataDump : Mod
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

        /// <summary>
        /// Fetches and compares the compiled version with the version from the site.
        /// </summary>
        /// <returns>Returns the current version.  Includes additional text if the current version doesn't match the version of the site.</returns>
        public override string GetVersion() => FileVersionInfo.GetVersionInfo(Assembly.GetAssembly(typeof(PlayerDataDump)).Location).FileVersion;

        public override bool IsCurrent()
        {
            try
            {
                GithubVersionHelper helper = new GithubVersionHelper("iamwyza/HollowKnightRandomizerTracker");
                Version currentVersion = new Version(GetVersion());
                
                Version newVersion = new Version(helper.GetVersion());
                LogDebug($"Comparing Versions: {newVersion} > {currentVersion}");
                return newVersion.CompareTo(currentVersion) < 0;
            }
            catch (Exception ex)
            {
                LogError("Couldn't check version" + ex);
            }

            return true;
        }

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

                try
                {
                    RandomizerMod.Randomizer.SetPlayerBoolHook += ss.EchoBool;
                    RandomizerMod.Randomizer.SetPlayerIntHook += ss.EchoInt;
                }
                catch
                {
                    ModHooks.Instance.SetPlayerBoolHook += ss.EchoBool;
                    ModHooks.Instance.SetPlayerIntHook += ss.EchoInt;
                }

                ModHooks.Instance.ApplicationQuitHook += ss.OnQuit;
            });
            
            //Setup ProfileStorage Server
            _wss.AddWebSocketService<ProfileStorageServer>("/ProfileStorage", ss => { });

            _wss.Start();

            Log("Initialized PlayerDataDump");
        }
    }
}
