using Modding;
using System;
using System.IO;
using System.Text;
using UnityEngine;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace PlayerDataDump
{
    internal class ProfileStorageServer : WebSocketBehavior
    {
        public ProfileStorageServer()
        {
            IgnoreExtensions = true;
        }
        public void Broadcast(string s)
        {
            Sessions.Broadcast(s);
        }

        protected override void OnMessage(MessageEventArgs e)
        {
            ModHooks.ModLog("[PlayerDataDump.ProfileStorage] data:" + e.Data);

            if (e.Data.StartsWith("load"))
            {
                string[] temp = e.Data.Split('|');
                if (int.TryParse(temp[1], out int profileId))
                {
                    Send(profileId + "|" + GetProfile(profileId));
                }
            }else if (e.Data.StartsWith("save"))
            {
                string[] temp = e.Data.Split('|');
                if (int.TryParse(temp[1], out int profileId))
                {
                    SaveProfile(profileId, temp[2]);
                    Broadcast(profileId + "|" + GetProfile(profileId));
                }
            }else
            {
                Send("load|int,save|int|{data}");
            }
        }

        private static string GetProfile(int i)
        {
            string path = Application.persistentDataPath + $"/OverlayProfile.{i}.js";
            if (!File.Exists(path)) return "undefined";

            string data = File.ReadAllText(path);
            return Convert.ToBase64String(Encoding.UTF8.GetBytes(data));
        }

        private static void SaveProfile(int profileId, string base64EncodedJson)
        {
            string path = Application.persistentDataPath + $"/OverlayProfile.{profileId}.js";
            byte[] data = Convert.FromBase64String(base64EncodedJson);
            string decodedString = Encoding.UTF8.GetString(data);

            ModHooks.ModLog("[PlayerDataDump.ProfileStorage] Path::" + path);
            ModHooks.ModLog("[PlayerDataDump.ProfileStorage] Decoded Data:" + decodedString);

            File.WriteAllText(path, decodedString);

        }

        protected override void OnError(WebSocketSharp.ErrorEventArgs e)
        {
            ModHooks.ModLog("[PlayerDataDump.ProfileStorage] ERROR: " + e.Message);
        }

        protected override void OnClose(CloseEventArgs e)
        {
            base.OnClose(e);

            ModHooks.ModLog("[PlayerDataDump.ProfileStorage] CLOSE: Code:" + e.Code + ", Reason:" + e.Reason);
        }

        protected override void OnOpen()
        {
            ModHooks.ModLog("[PlayerDataDump.ProfileStorage] OPEN");
        }
    }
}
