using System;
using System.IO;
using System.Text;
using UnityEngine;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace HKTracker
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
            HKTracker.Instance.Log("[ProfileStorage] data:" + e.Data);

            if (e.Data.StartsWith("load"))
            {
                string[] temp = e.Data.Split('|');
                if (int.TryParse(temp[1], out int profileId))
                {
                    Send(profileId + "|" + GetProfile(profileId));
                }
            } else if (e.Data.StartsWith("save"))
            {
                string[] temp = e.Data.Split('|');
                if (int.TryParse(temp[1], out int profileId))
                {
                    SaveProfile(profileId, temp[2]);
                    Broadcast(profileId + "|" + GetProfile(profileId));
                }
            } else if (e.Data.StartsWith("OBSGetPreset"))
            {
                OnPresetEvent();
                
            } else if (e.Data.StartsWith("OBSGetStyle"))
            {
                OnStyleEvent();
            } else if (e.Data.StartsWith("OBSGetGlow"))
            {
                onGlowEvent();
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

            HKTracker.Instance.Log("[ProfileStorage] Path:" + path);
            HKTracker.Instance.Log("[ProfileStorage] Decoded Data:" + decodedString);

            File.WriteAllText(path, decodedString);

        }

        protected override void OnError(WebSocketSharp.ErrorEventArgs e)
        {
            HKTracker.Instance.LogError("[ProfileStorage]:" + e.Message);
            HKTracker.Instance.LogError("[ProfileStorage]:" + e.Exception);
        }

        protected override void OnClose(CloseEventArgs e)
        {
            base.OnClose(e);
            GlobalSettings.StyleEvent -= OnStyleEvent;
            GlobalSettings.PresetEvent -= OnPresetEvent;
            GlobalSettings.GlowEvent -= onGlowEvent;
            HKTracker.Instance.Log("[ProfileStorage] CLOSE: Code:" + e.Code + ", Reason:" + e.Reason);
        }

        protected override void OnOpen()
        {
            HKTracker.Instance.Log("[ProfileStorage] OPEN");
        }

        public void OnStyleEvent()
        {
            HKTracker.Instance.LogDebug("sending: " + "Style|" + HKTracker.GS.TrackerStyle);
            Send("Style|" + HKTracker.GS.TrackerStyle);
        }
        public void OnPresetEvent()
        {
            HKTracker.Instance.LogDebug("sending: " + "Preset|" + HKTracker.GS.TrackerProfile);
            Send("Preset|" + HKTracker.GS.TrackerProfile);
        }
        public void onGlowEvent()
        {
            HKTracker.Instance.LogDebug("sending: " + "BorderGlow|" + HKTracker.GS.TrackerGlow);
            Send("BorderGlow|" + HKTracker.GS.TrackerGlow);
        }
    }
}
