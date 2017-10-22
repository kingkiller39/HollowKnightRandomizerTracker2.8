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
        
        private static HashSet<string> intKeysToSend = new HashSet<string> {"simpleKeys", "nailDamage", "maxHealth", "MPReserveMax", "ore", "rancidEggs", "grubsCollected", "charmSlotsFilled", "charmSlots" };

        public void Broadcast(String s)
        {
            Sessions.Broadcast(s);
        }

        protected override void OnMessage(MessageEventArgs e)
        {
            switch (e.Data)
            {
                case "random":
                    if (File.Exists(Application.persistentDataPath + "/rnd.js"))
                    {
                        Send(GetRandom());
                    }
                    else
                    {
                        Send("undefined");
                    }
                        break;
                case "mods":
                    Send(PlayerDataDump.GetCurrentMods());
                    break;
                case "version":
                    Send(String.Format("{{ \"version\":\"{0}\" }}", PlayerDataDump.version));
                    break;
                case "json":
                    Send(GetJson());
                    break;
                case "relics":
                    Send(GetRelics());
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
                        Send("random,mods,version,json,bool|{var},int|{var}|relics");
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

            ModHooks.Instance.NewGameHook -= this.NewGame;
            ModHooks.Instance.SavegameLoadHook -= this.LoadSave;
            ModHooks.Instance.SetPlayerBoolHook -= this.EchoBool;
            ModHooks.Instance.SetPlayerIntHook -= this.EchoInt;

            ModHooks.Instance.ApplicationQuitHook -= this.OnQuit;

            ModHooks.ModLog("[PlayerDataDump] CLOSE: Code:" + e.Code + ", Reason:" + e.Reason);
        }

        protected override void OnOpen()
        {
            ModHooks.ModLog("[PlayerDataDump] OPEN");
        }

        public void sendMessage(string var, string value)
        {
            Send(new Row(var, value).ToJsonElementPair);
        }

        public void LoadSave(int slot)
        {
            sendMessage("SaveLoaded", "true");
        }

        public void EchoBool(string var, bool value)
        {
            if (var.StartsWith("gotCharm_") || var.StartsWith("brokenCharm_") || var.StartsWith("equippedCharm_") || var.StartsWith("has") || var.StartsWith("maskBroken") || var == "overcharmed")
            {
                sendMessage(var, value.ToString());
            }
        }


        public void EchoInt(string var, int value)
        {
            if (intKeysToSend.Contains(var) || var.EndsWith("Level") || var.StartsWith("trinket") )
            {
                sendMessage(var, value.ToString());
            }
        }

        public static string GetJson()
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

        public static string GetRandom()
        {
            String path = Application.persistentDataPath + "/rnd.js";
            String data = File.ReadAllText(path);
            return data;
        }

        public static string GetRelics()
        {
            List<Row> relics = new List<Row>
            {
                new Row(nameof(PlayerData.instance.trinket1), PlayerData.instance.trinket1),
                new Row(nameof(PlayerData.instance.trinket2), PlayerData.instance.trinket2),
                new Row(nameof(PlayerData.instance.trinket3), PlayerData.instance.trinket3),
                new Row(nameof(PlayerData.instance.trinket4), PlayerData.instance.trinket4)
            };

            return ToJson(relics);
        }

        public void NewGame()
        {
            sendMessage("NewSave", "true");
        }


        public void OnQuit()
        {
            sendMessage("GameExiting", "true");
        }

        public struct Row
        {
            public string var { get; set; }
            public object value { get; set; }

            public Row(string _var, object _value)
            {
                var = _var;
                value = _value;
            }

            public string ToJsonElementPair => " { \"var\" : \"" + var + "\",  \"value\" :  \"" + value + "\" }";
            public string ToJsonElement => $"\"{var}\" : \"{value}\"";
        }

        //I know there is a jsonhelper, but for the life of me, I could not get the serialization to work.
        private static string ToJson(IEnumerable<Row> data)
        {
            StringBuilder ret = new StringBuilder();
            ret.Append("{");
            ret.Append(string.Join(",", data.Select(x => x.ToJsonElement).ToArray()));
            ret.Append("}");
            return ret.ToString();
        }

    }


}
