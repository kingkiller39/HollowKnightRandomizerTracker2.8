using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace PlayerDataDump.StandAlone
{
    class SocketServer : WebSocketBehavior
    {
        private string _path;
        private SaveGameManager _saveGameManager;
        private JsonSerializerSettings _jsonSerializerSettings;
        private FileSystemWatcher _fileSystemWatcher;
        private DateTime _lastEventTime;

        public SocketServer() {

        }

        public void Init(string path)
        {
            IgnoreExtensions = true;
            _path = path;
            _saveGameManager = new SaveGameManager();
            _jsonSerializerSettings = new JsonSerializerSettings()
            {
                ReferenceLoopHandling = ReferenceLoopHandling.Ignore
            };
            _fileSystemWatcher = new FileSystemWatcher()
            {
                Path = path,
                Filter = "user*.dat",
                NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.CreationTime,
                EnableRaisingEvents = true,
                IncludeSubdirectories = false
            };

            _fileSystemWatcher.Changed += FileSystemWatcher_Update;
            _fileSystemWatcher.Created += FileSystemWatcher_Update;
            _lastEventTime = DateTime.Now;

            if(File.Exists(_path + "/user1.dat"))
            {
                _saveGameManager.Load(_path + "/user1.dat");
            }
            
        }

        private void FileSystemWatcher_Update(object sender, FileSystemEventArgs e)
        {
            _saveGameManager.Load(e.FullPath);
            Send(GetJson());
        }

        // private static HashSet<string> intKeysToSend = new HashSet<string> {"simpleKeys", "nailDamage", "maxHealth", "MPReserveMax", "ore", "rancidEggs", "grubsCollected", "charmSlotsFilled", "charmSlots" };

        public void Broadcast(String s)
        {
            Sessions.Broadcast(s);
        }

        protected override void OnMessage(MessageEventArgs e)
        {
            switch (e.Data)
            {
                case "random":
                       Send("undefined");
                       break;
                case "mods":
                    Send("{}");
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
                            string b = PlayerData.instance.GetBool(e.Data.Split('|')[1]).ToString();
                            sendMessage(e.Data.Split('|')[1], b);
                        }
                        if (e.Data.Split('|')[0] == "int")
                        {
                            string i = PlayerData.instance.GetInt(e.Data.Split('|')[1]).ToString();
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
            Console.WriteLine("[PlayerDataDump] ERROR: " + e.Message);
        }

        protected override void OnClose(CloseEventArgs e)
        {
            base.OnClose(e);

            Console.WriteLine("[PlayerDataDump] CLOSE: Code:" + e.Code + ", Reason:" + e.Reason);
        }

        protected override void OnOpen()
        {
            Console.WriteLine("[PlayerDataDump] OPEN");
        }

        public void sendMessage(string var, string value)
        {
            Send(new Row(var, value).ToJsonElementPair);
        }

        
        //public void EchoBool(string var, bool value)
        //{
        //    if (var.StartsWith("gotCharm_") || var.StartsWith("brokenCharm_") || var.StartsWith("equippedCharm_") || var.StartsWith("has") || var.StartsWith("maskBroken") || var == "overcharmed")
        //    {
        //        sendMessage(var, value.ToString());
        //    }
        //}


        //public void EchoInt(string var, int value)
        //{
        //    if (intKeysToSend.Contains(var) || var.EndsWith("Level") || var.StartsWith("trinket") )
        //    {
        //        sendMessage(var, value.ToString());
        //    }
        //}

        public string GetJson()
        {
            return JsonConvert.SerializeObject(PlayerData.instance, _jsonSerializerSettings);
        }

        
        public string GetRelics()
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
