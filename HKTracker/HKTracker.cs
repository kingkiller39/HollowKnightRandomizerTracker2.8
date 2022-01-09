using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Modding;
using WebSocketSharp.Server;
using WebSocketSharp;
using System.Reflection;

namespace HKTracker
{

    /// <summary>
    /// Main mod class for PlayerDataDump.  Provides the server and version handling.
    /// </summary>
    public class HKTracker : Mod, IMenuMod, IGlobalSettings<GlobalSettings>
    {
        public static GlobalSettings GS = new GlobalSettings();
        public GlobalSettings OnSaveGlobal() => GS;
        public void OnLoadGlobal(GlobalSettings s) => GS = s;
        public override int LoadPriority() => 9999;
        private readonly WebSocketServer _wss = new WebSocketServer(11420);
        ProfileStorageServer temp = new ProfileStorageServer();
        string[] StyleValues = new string[] { "Classic", "Modern" };
        internal static HKTracker Instance;
        
        public bool ToggleButtonInsideMenu => true;

        /// <summary>
        /// Fetches the list of the current mods installed.
        /// </summary>
        public override string GetVersion() => FileVersionInfo.GetVersionInfo(Assembly.GetAssembly(typeof(HKTracker)).Location).FileVersion;
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
                ModHooks.NewGameHook += ss.NewGame;
                ModHooks.AfterSavegameLoadHook += ss.LoadSave;
                On.GameMap.Start += ss.gameMapStart;
                ModHooks.SetPlayerBoolHook += ss.EchoBool;
                ModHooks.SetPlayerIntHook += ss.EchoInt;
                ModHooks.ApplicationQuitHook += ss.OnQuit;
            });

            //Setup ProfileStorage Server
            _wss.AddWebSocketService<ProfileStorageServer>("/ProfileStorage", ss => {
                GlobalSettings.StyleEvent += ss.OnStyleEvent;
                GlobalSettings.PresetEvent += ss.OnPresetEvent;
                GlobalSettings.GlowEvent += ss.onGlowEvent;
            });

            _wss.Start();
            Log("Initialized PlayerDataDump");
            
        }
        public List<IMenuMod.MenuEntry> GetMenuData(IMenuMod.MenuEntry? toggleButtonEntry)
        {
            return new List<IMenuMod.MenuEntry>
            {
                new IMenuMod.MenuEntry
                {
                    Name = "Style",
                    Description = null,
                    Values = StyleValues,
                    Saver = opt => GS.TrackerStyle = (GlobalSettings.Style)opt,
                    Loader = () => (int)GS.TrackerStyle
                },
                new IMenuMod.MenuEntry
                {
                    Name = "Border Glow",
                    Description = "Enable or Disable Border Glow when using Modern Style",
                    Values = new string []
                    {
                        "On",
                        "Off"
                    },
                    Saver = opt => GS.TrackerGlow = (GlobalSettings.BorderGlow)opt,
                    Loader = () => (int)GS.TrackerGlow
                },
                new IMenuMod.MenuEntry
                {
                    Name = "Presets",
                    Description = "Only works with OBS and browser source set to kingkiller39.github.io/HollowKnightRandomizerTracker2.8",
                    Values = new string []
                    {
                        "Player Custom 1",
                        "Player Custom 2",
                        "Player Custom 3",
                        "Everything",
                        "Minimal Left",
                        "Minimal Right",
                        "Rando Racing"
                    },
                    
                    Saver = opt => GS.TrackerProfile = (GlobalSettings.Profile)opt,
                    Loader = () => (int)GS.TrackerProfile
                }
            };
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
