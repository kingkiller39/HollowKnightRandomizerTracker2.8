using System;
using System.IO;
using System.Text;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace PlayerDataDump.StandAlone
{
    class ProfileStorageServer : WebSocketBehavior
    {
        private string _path;

        public ProfileStorageServer()
        {
        }

        public void Init(string path)
        {
            IgnoreExtensions = true;
            _path = path;
        }

        public void Broadcast(String s)
        {
            Sessions.Broadcast(s);
        }

        protected override void OnMessage(MessageEventArgs e)
        {
            Console.WriteLine("[PlayerDataDump.ProfileStorage] data:" + e.Data);

            if (e.Data.StartsWith("load"))
            {
                string[] temp = e.Data.Split('|');
                if (int.TryParse(temp[1], out int profileId))
                {
                    Send(profileId + "|" + getProfile(profileId));
                }
            }else if (e.Data.StartsWith("save"))
            {
                string[] temp = e.Data.Split('|');
                if (int.TryParse(temp[1], out int profileId))
                {
                    saveProfile(profileId, temp[2]);
                    Broadcast(profileId + "|" + getProfile(profileId));
                }
            }else
            {
                Send("load|int,save|int|{data}");
            }
        }

        private string getProfile(int i)
        {
            String path = _path + $"/OverlayProfile.{i}.js";
            if (File.Exists(path))
            {
                string data = File.ReadAllText(path);
                return Convert.ToBase64String(Encoding.UTF8.GetBytes(data));
            }

            return "undefined";
        }

        private void saveProfile(int profileId, string base64EncodedJson)
        {
            String path = _path + $"/OverlayProfile.{profileId}.js";
            byte[] data = Convert.FromBase64String(base64EncodedJson);
            string decodedString = Encoding.UTF8.GetString(data);

            Console.WriteLine("[PlayerDataDump.ProfileStorage] Path::" + path);
            Console.WriteLine("[PlayerDataDump.ProfileStorage] Decoded Data:" + decodedString);

            File.WriteAllText(path, decodedString);

        }

        protected override void OnError(WebSocketSharp.ErrorEventArgs e)
        {
            Console.WriteLine("[PlayerDataDump.ProfileStorage] ERROR: " + e.Message);
        }

        protected override void OnClose(CloseEventArgs e)
        {
            base.OnClose(e);

            Console.WriteLine("[PlayerDataDump.ProfileStorage] CLOSE: Code:" + e.Code + ", Reason:" + e.Reason);
        }

        protected override void OnOpen()
        {
            Console.WriteLine("[PlayerDataDump.ProfileStorage] OPEN");
        }
    }
}
