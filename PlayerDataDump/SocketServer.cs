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
            if (e.Data == "random")
            {
                Send(getRandom());
            }
            else if (e.Data == "json")
            {
                Send(getJson());
            }
            else
            {
                if (e.Data.Contains('|'))
                {
                    if (e.Data.Split('|')[0] == "bool")
                    {
                        string b = ModHooks.Instance.GetPlayerBool(e.Data.Split('|')[1]).ToString();
                        Send("{"
                        + "\"var\":\"" + e.Data.Split('|')[1] + "\","
                        + "\"value\":\"" + b + "\""
                        + "}"
                        ); 
                    }
                    if (e.Data.Split('|')[0] == "int")
                    {
                        string i = ModHooks.Instance.GetPlayerInt(e.Data.Split('|')[1]).ToString();
                        Send("{"
                        + "\"var\":\"" + e.Data.Split('|')[1] + "\","
                        + "\"value\":\"" + i + "\""
                        + "}"
                        ); 
                    }
                }
                //Send("the only supported request is \"json\"");
            }
            ModHooks.ModLog("[PlayerDataDump] MSG: " + e.Data);
            //Send("I'll be the one sending messages here");
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
            ModHooks.Instance.SetPlayerBoolHook -= this.updateJson;
            ModHooks.Instance.SetPlayerIntHook -= this.updateJson;

            ModHooks.Instance.ApplicationQuitHook -= this.onQuit;

            ModHooks.ModLog("[PlayerDataDump] CLOSE: Code:" + e.Code + ", Reason:" + e.Reason);
        }

        protected override void OnOpen()
        {
            ModHooks.ModLog("[PlayerDataDump] OPEN");
        }


        public void loadSave(int slot)
        {
            Send("{"
                + "\"var\":\"SaveLoaded\","
                + "\"value\":\"true\""
                + "}"
                );
        }

        public void updateJson(string var, bool value)
        {
            if (var.StartsWith("gotCharm_") || var.StartsWith("equippedCharm_") || var.StartsWith("has") || var.StartsWith("maskBroken") || var == "overcharmed")
            {
                Send("{"
                + "\"var\":\"" + var + "\","
                + "\"value\":\"" + value.ToString() + "\""
                + "}"
                );
            }
        }

        public void updateJson(string var, int value)
        {
            //trinket1, trinket2, trinket3, trinket4, ore, rancidEggs, & grubsCollected?
            if (var.EndsWith("Level") || var == "simpleKeys" || var == "nailDamage" || var == "maxHealth" || var == "MPReserveMax" || var.StartsWith("trinket") || var == "ore" || var == "rancidEggs" || var == "grubsCollected")
            {
                Send("{"
                + "\"var\":\"" + var + "\","
                + "\"value\":\"" + value.ToString() + "\""
                + "}"
                );
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
