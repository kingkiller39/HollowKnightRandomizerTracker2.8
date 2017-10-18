using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using WebSocketSharp;
using WebSocketSharp.Server;
using Modding;
using UnityEngine;
using System.IO;

namespace PlayerDataDump
{
    class SocketServer : WebSocketBehavior
    {
        public void Broadcast(String s)
        {
            Sessions.Broadcast(s);
        }

        protected override void OnMessage(MessageEventArgs e)
        {
            switch (e.Data)
            {
                case "random":
                    Send(getRandom());
                    break;
                case "mods":
                    Send(PlayerDataDump.GetCurrentMods());
                    break;
                case "version":
                    Send(PlayerDataDump.version);
                    break;
                case "json":
                    Send(getJson());
                    break;
                default:
                    if (e.Data.Contains('|'))
                    {
                        if (e.Data.Split('|')[0] == "bool")
                        {
                            string b = ModHooks.Instance.GetPlayerBool(e.Data.Split('|')[1]).ToString();
                            sendMessage(e.Data.Split('|')[1], b);
                        }
                        if (e.Data.Split('|')[0] == "int")
                        {
                            string i = ModHooks.Instance.GetPlayerInt(e.Data.Split('|')[1]).ToString();
                            sendMessage(e.Data.Split('|')[1], i);
                        }
                    }
                    else
                    {
                        Send("random,mods,version,json,bool|{var},int|{var}");
                    }
                    break;
            }
        }

        protected override void OnError(WebSocketSharp.ErrorEventArgs e)
        {
            ModHooks.ModLog("[PlayerDataDump] ERROR: " + e.Message);
        }

        protected override void OnClose(CloseEventArgs e)
        {
            base.OnClose(e);

            ModHooks.Instance.NewGameHook -= this.newGame;
            ModHooks.Instance.SavegameLoadHook -= this.loadSave;
            ModHooks.Instance.SetPlayerBoolHook -= this.echoBool;
            ModHooks.Instance.SetPlayerIntHook -= this.echoInt;

            ModHooks.Instance.ApplicationQuitHook -= this.onQuit;

            ModHooks.ModLog("[PlayerDataDump] CLOSE: Code:" + e.Code + ", Reason:" + e.Reason);
        }

        protected override void OnOpen()
        {
            ModHooks.ModLog("[PlayerDataDump] OPEN");
        }

        public void sendMessage(string var, string value)
        {
            Send(String.Format("{{ {0} : {1}, {2} : {3} }}", "\"var\"", '"' + var + '"', "\"value\"", '"' + value + '"'));
        }

        public void loadSave(int slot)
        {
            sendMessage("SaveLoaded", "true");
        }

        public void echoBool(string var, bool value)
        {
            if (var.StartsWith("gotCharm_") || var.StartsWith("brokenCharm_") || var.StartsWith("equippedCharm_") || var.StartsWith("has") || var.StartsWith("maskBroken") || var == "overcharmed")
            {
                sendMessage(var, value.ToString());
            }
        }


        public void echoInt(string var, int value)
        {
            if (var.EndsWith("Level") || var == "simpleKeys" || var == "nailDamage" || var == "maxHealth" || var == "MPReserveMax" || var.StartsWith("trinket") || var == "ore" || var == "rancidEggs" || var == "grubsCollected")
            {
                sendMessage(var, value.ToString());
            }
        }

        public static string getJson()
        {
            PlayerData playerData = PlayerData.instance;
            String json = JsonUtility.ToJson(playerData);

            int randomFireballLevel = ModHooks.Instance.GetPlayerInt("_fireballLevel");
            int randomQuakeLevel = ModHooks.Instance.GetPlayerInt("_quakeLevel");
            int randomScreamLevel = ModHooks.Instance.GetPlayerInt("_screamLevel");

            if (randomFireballLevel >= 0)
            {
                PlayerData pd = JsonUtility.FromJson<PlayerData>(json);
                pd.fireballLevel = randomFireballLevel;
                pd.quakeLevel = randomQuakeLevel;
                pd.screamLevel = randomScreamLevel;
                json = JsonUtility.ToJson(pd);
            }

            return json;
        }

        public static string getRandom()
        {
            String path = Application.persistentDataPath + "/rnd.js";
            String data = File.ReadAllText(path);
            return data;
        }

        public void newGame()
        {
            Send("{"
    + "\"var\":\"NewSave\","
    + "\"value\":\"true\""
    + "}"
    );
        }


        public void onQuit()
        {
            Send("{"
                + "\"var\":\"GameExiting\","
                + "\"value\":\"true\""
                + "}"
                );
        }
    }
}
