using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using Modding;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using HutongGames.PlayMaker;
using System.Reflection;
using WebSocketSharp.Server;

namespace PlayerDataDump
{
    public class PlayerDataDump : Mod
    {
        public WebSocketServer wss = new WebSocketServer(11420);
        public static String version = "16/10/17.c";
        public static String current;

        public static string GetCurrentMods()
        {
            List<string> mods = ModHooks.Instance.loadedMods;
            string output = "[";
            foreach (string mod in mods)
            {
                output += String.Format("\"{0}\",", mod);
            }
            output = output.TrimEnd(',') + "]";
            return output;
        }

        public string GetCurrentVersion()
        {
            try
            {
                System.Net.WebClient web = new System.Net.WebClient();
                System.IO.Stream stream = web.OpenRead("https://iamwyza.github.io/HollowKnightRandomizerTracker/version.txt");
                using (System.IO.StreamReader reader = new System.IO.StreamReader(stream))
                {
                    return reader.ReadToEnd();
                }
            } catch (Exception e){
                return version;
            }
        }

        public override string GetVersion()
        {
            if (current == null)
                current = GetCurrentVersion();
            if ( current == version )
                return version;
            return version + " | UPDATE REQUIRED";
        }

        public override void Initialize()
        {
            ModHooks.ModLog("Initializing PlayerDataDump");

            //Setup websockets server
             wss.AddWebSocketService<SocketServer>(
              "/playerData",
              () =>{
                  SocketServer ss = new SocketServer()
                  {
                    IgnoreExtensions = true
                  };

                  ModHooks.Instance.NewGameHook += ss.newGame;
                  ModHooks.Instance.SavegameLoadHook += ss.loadSave;
                  ModHooks.Instance.SetPlayerBoolHook += ss.echoBool;
                  ModHooks.Instance.SetPlayerIntHook += ss.echoInt;

                  ModHooks.Instance.ApplicationQuitHook += ss.onQuit;

                  return ss;
              }
            );
            wss.Start();

            ModHooks.ModLog("Initialized PlayerDataDump");
        }
    }
}
