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

        public override string GetVersion()
        {
            return "16/10/17.b";
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
                  ModHooks.Instance.SetPlayerBoolHook += ss.updateJson;
                  ModHooks.Instance.SetPlayerIntHook += ss.updateJson;

                  ModHooks.Instance.ApplicationQuitHook += ss.onQuit;

                  return ss;
              }
            );
            wss.Start();

            ModHooks.ModLog("Initialized PlayerDataDump");
        }
    }
}
