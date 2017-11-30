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
    internal class SocketServer : WebSocketBehavior
    {

        public SocketServer()
        {
            IgnoreExtensions = true;
        }

        private static readonly HashSet<string> IntKeysToSend = new HashSet<string> {"simpleKeys", "nailDamage", "maxHealth", "MPReserveMax", "ore", "rancidEggs", "grubsCollected", "charmSlotsFilled", "charmSlots" };

        public void Broadcast(string s)
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
                    Send(string.Format("{{ \"version\":\"{0}\" }}", PlayerDataDump.Instance.GetVersion()));
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
                            string b = PlayerData.instance.GetBool(e.Data.Split('|')[1]).ToString();
                            SendMessage(e.Data.Split('|')[1], b);
                        }
                        if (e.Data.Split('|')[0] == "int")
                        {
                            string i = PlayerData.instance.GetInt(e.Data.Split('|')[1]).ToString();
                            SendMessage(e.Data.Split('|')[1], i);
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
            PlayerDataDump.Instance.LogError(e.Message);
        }

        protected override void OnClose(CloseEventArgs e)
        {
            base.OnClose(e);

            ModHooks.Instance.NewGameHook -= NewGame;
            ModHooks.Instance.SavegameLoadHook -= LoadSave;
            ModHooks.Instance.SetPlayerBoolHook -= EchoBool;
            ModHooks.Instance.SetPlayerIntHook -= EchoInt;

            ModHooks.Instance.ApplicationQuitHook -= OnQuit;

            PlayerDataDump.Instance.Log("CLOSE: Code:" + e.Code + ", Reason:" + e.Reason);
        }

        protected override void OnOpen()
        {
            PlayerDataDump.Instance.Log("OPEN");
        }

        public void SendMessage(string var, string value)
        {
            Send(new Row(var, value).ToJsonElementPair);
        }

        public void LoadSave(int slot)
        {
            SendMessage("SaveLoaded", "true");
        }

        public void EchoBool(string var, bool value)
        {
            if (var.StartsWith("gotCharm_") || var.StartsWith("brokenCharm_") || var.StartsWith("equippedCharm_") || var.StartsWith("has") || var.StartsWith("maskBroken") || var == "overcharmed")
            {
                SendMessage(var, value.ToString());
            }
        }


        public void EchoInt(string var, int value)
        {
            if (IntKeysToSend.Contains(var) || var.EndsWith("Level") || var.StartsWith("trinket") )
            {
                SendMessage(var, value.ToString());
            }
        }

        public static string GetJson()
        {
            PlayerData playerData = PlayerData.instance;
            string json = JsonUtility.ToJson(playerData);
            
            int randomFireballLevel = PlayerData.instance.GetInt("_fireballLevel");
            int randomQuakeLevel = PlayerData.instance.GetInt("_quakeLevel");
            int randomScreamLevel = PlayerData.instance.GetInt("_screamLevel");

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
            string path = Application.persistentDataPath + "/rnd.js";
            string data = File.ReadAllText(path);
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
            SendMessage("NewSave", "true");
        }


        public void OnQuit()
        {
            SendMessage("GameExiting", "true");
        }

        public struct Row
        {
            // ReSharper disable once InconsistentNaming
            public string var { get; set; }
            // ReSharper disable once InconsistentNaming
            public object value { get; set; }

            public Row(string var, object value)
            {
                this.var = var;
                this.value = value;
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
