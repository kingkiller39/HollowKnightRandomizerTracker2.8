using Modding;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using UnityEngine;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace PlayerDataDump
{
    class ProfileStorageServer : WebSocketBehavior
    {
        public void Broadcast(String s)
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
            String path = Application.persistentDataPath + $"/OverlayProfile.{i}.js";
            if (File.Exists(path))
            {
                string data = File.ReadAllText(path);
                return Convert.ToBase64String(Encoding.UTF8.GetBytes(data));
            }

            return "undefined";
        }

        private void saveProfile(int profileId, string base64EncodedJson)
        {
            String path = Application.persistentDataPath + $"/OverlayProfile.{profileId}.js";
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
