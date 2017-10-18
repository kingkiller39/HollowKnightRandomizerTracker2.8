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
using System.Net;

namespace PlayerDataDump
{
    public class PlayerDataDump : Mod
    {
        public WebSocketServer wss = new WebSocketServer(11420);
        public static String version = "18/10/17.a";
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
                web.Headers[HttpRequestHeader.UserAgent] = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.2 (KHTML, like Gecko) Chrome/15.0.874.121 Safari/535.2";
                string text = web.DownloadString("https://iamwyza.github.io/HollowKnightRandomizerTracker/version.txt");
                //string text = web.DownloadString("http://www.google.com");
            
                return text;
            } catch (Exception e){
                return version;
            }
        }

        public override string GetVersion()
        {
            if (current == null)
                current = GetCurrentVersion();
            ModHooks.ModLog("c: " + current);
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
