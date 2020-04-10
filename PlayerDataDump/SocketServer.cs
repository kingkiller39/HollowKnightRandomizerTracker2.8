using System.Collections.Generic;
using Modding;
using WebSocketSharp;
using WebSocketSharp.Server;
using UnityEngine;

namespace PlayerDataDump
{
    internal class SocketServer : WebSocketBehavior
    {
        public SocketServer()
        {
            IgnoreExtensions = true;
        }

        private static readonly HashSet<string> IntKeysToSend = new HashSet<string> {"simpleKeys", "nailDamage", "maxHealth", "MPReserveMax", "ore", "rancidEggs", "grubsCollected", "charmSlotsFilled", "charmSlots", "flamesCollected" };

        public void Broadcast(string s)
        {
            Sessions.Broadcast(s);
        }

        protected override void OnMessage(MessageEventArgs e)
        {
            if (State != WebSocketState.Open) return;

            switch (e.Data)
            {
                case "mods":
                    Send(JsonUtility.ToJson(ModHooks.Instance.LoadedModsWithVersions));
                    break;
                case "version":
                    Send($"{{ \"version\":\"{PlayerDataDump.Instance.GetVersion()}\" }}");
                    break;
                case "json":
                    Send(GetJson());
                    GetRandom();
                    break;
                default:
                    if (e.Data.Contains('|'))
                    {
                        switch (e.Data.Split('|')[0])
                        {
                            case "bool":
                                string b = PlayerData.instance.GetBool(e.Data.Split('|')[1]).ToString();
                                SendMessage(e.Data.Split('|')[1], b);
                                break;
                            case "int":
                                string i = PlayerData.instance.GetInt(e.Data.Split('|')[1]).ToString();
                                SendMessage(e.Data.Split('|')[1], i);
                                break;
                        }
                    }
                    else
                    {
                        Send("mods,version,json,bool|{var},int|{var}");
                    }
                    break;
            }
        }

        protected override void OnError(ErrorEventArgs e)
        {
            PlayerDataDump.Instance.LogError(e.Message);
        }

        protected override void OnClose(CloseEventArgs e)
        {
            base.OnClose(e);
            
            ModHooks.Instance.NewGameHook -= NewGame;
            ModHooks.Instance.SavegameLoadHook -= LoadSave;
            ModHooks.Instance.BeforeSavegameSaveHook -= BeforeSave;
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
            if (State != WebSocketState.Open) return;

            Send(new Row(var, value).ToJsonElementPair);
        }

        public void LoadSave(int slot)
        {
            GetRandom();
            SendMessage("SaveLoaded", "true");
        }

        public void BeforeSave(SaveGameData data)
        {
            SendMessage("SaveLoaded", "true");
        }

        public void EchoBool(string var, bool value)
        {
            PlayerDataDump.Instance.LogDebug($"EchoBool: {var} = {value}");
        
            if (var == "RandomizerMod.Monomon" || var == "AreaRando.Monomon" || var == "monomonDefeated")
            {
                var= "maskBrokenMonomon";
            }
            else if (var == "RandomizerMod.Lurien" || var == "AreaRando.Lurien" || var == "lurienDefeated")
            {
                var= "maskBrokenLurien";
            }
            else if (var == "RandomizerMod.Herrah" || var == "AreaRando.Herrah" || var == "hegemolDefeated")
            {
                var= "maskBrokenHegemol";
            }
            if (var.StartsWith("RandomizerMod"))
            {
                var = var.Remove(0, 14);
            }
            else if (var.StartsWith("AreaRando"))
            {
                var = var.Remove(0, 10);
            }
            if (var.StartsWith("RandomizerMod.has") || var.StartsWith("gotCharm_") || var.StartsWith("brokenCharm_") || var.StartsWith("equippedCharm_") || var.StartsWith("has") || var.StartsWith("maskBroken") || var == "overcharmed" || var.StartsWith("used") || var.StartsWith("opened") || var.StartsWith("gave") || var == "unlockedCompletionRate" || var.EndsWith("Collected"))
            {
                SendMessage(var, value.ToString());
            }
            PlayerData.instance.SetBoolInternal(var, value);
            SendMessage("bench", PlayerData.instance.respawnScene.ToString());
        }

       public void EchoInt(string var, int value)
        {
            PlayerDataDump.Instance.LogDebug($"EchoInt: {var} = {value}");
            if ( var == "royalCharmState" && (value == 1 || value == 2 || value == 3 || value == 4 ))
            {
                EchoBool("gotCharm_36", true);
            }
            if (IntKeysToSend.Contains(var) || var.EndsWith("Level") || var.StartsWith("trinket") || var == "nailSmithUpgrades" || var == "rancidEggs" || var == "royalCharmState" || var == "dreamOrbs" || var.EndsWith("Collected"))
            {
                SendMessage(var, value.ToString());
            }
            PlayerData.instance.SetIntInternal(var, value);
        }

        public static string GetJson()
        {
            PlayerData playerData = PlayerData.instance;
            string json = JsonUtility.ToJson(playerData);

            return json;
        }

        public void GetRandom()
        {
            try
            {
                var settings = RandomizerMod.RandomizerMod.Instance.Settings;
                if (settings.Randomizer)
                {
                    var msgText = "";
                    if (settings.Cursed)
                        msgText += "Cursed ";

                    if (settings.ConnectAreas || settings.RandomizeTransitions)
                    {
                        if (settings.ConnectAreas)
                            msgText += "Connected-Area ";

                        if (settings.RandomizeRooms)
                            msgText += "Room ";
                        else if (settings.RandomizeAreas)
                            msgText += "Area ";

                        msgText += "Rando ";
                    }
                    else
                    {
                        msgText += "Item Rando";
                    }
                    SendMessage("rando_type", msgText.Trim());



                    bool presetClassic = !settings.RandomizeDreamers && settings.RandomizeSkills && settings.RandomizeCharms && !settings.RandomizeKeys && settings.RandomizeGeoChests && !settings.RandomizeMaskShards && !settings.RandomizeVesselFragments && !settings.RandomizePaleOre && !settings.RandomizeCharmNotches && !settings.RandomizeRancidEggs && !settings.RandomizeRelics;
                    bool presetProgressive = settings.RandomizeDreamers && settings.RandomizeSkills && settings.RandomizeCharms && settings.RandomizeKeys && !settings.RandomizeGeoChests && !settings.RandomizeMaskShards && !settings.RandomizeVesselFragments && !settings.RandomizePaleOre && !settings.RandomizeCharmNotches && !settings.RandomizeRancidEggs && !settings.RandomizeRelics;
                    bool presetCompletionist = settings.RandomizeDreamers && settings.RandomizeSkills && settings.RandomizeCharms && settings.RandomizeKeys && settings.RandomizeGeoChests && settings.RandomizeMaskShards && settings.RandomizeVesselFragments && settings.RandomizePaleOre && settings.RandomizeCharmNotches && !settings.RandomizeRancidEggs && !settings.RandomizeRelics;
                    bool presetJunkPit = settings.RandomizeDreamers && settings.RandomizeSkills && settings.RandomizeCharms && settings.RandomizeKeys && settings.RandomizeGeoChests && settings.RandomizeMaskShards && settings.RandomizeVesselFragments && settings.RandomizePaleOre && settings.RandomizeCharmNotches && settings.RandomizeRancidEggs && settings.RandomizeRelics;

                    bool presetCollector = settings.RandomizeDreamers && settings.RandomizeSkills && settings.RandomizeCharms && settings.RandomizeKeys &&
                        !settings.RandomizeGeoChests && !settings.RandomizeMaskShards && !settings.RandomizeVesselFragments && !settings.RandomizePaleOre &&
                        !settings.RandomizeCharmNotches && !settings.RandomizeRancidEggs && !settings.RandomizeRelics && settings.RandomizeMaps &&
                        settings.RandomizeStags && settings.RandomizeGrubs && settings.RandomizeWhisperingRoots;
                    bool presetSuperJunkPit = presetJunkPit && settings.RandomizeMaps && settings.RandomizeStags && settings.RandomizeGrubs && settings.RandomizeWhisperingRoots;

                    SendMessage("seed", settings.Seed.ToString());
                    if (settings.AcidSkips && settings.FireballSkips && settings.MildSkips && settings.ShadeSkips && settings.SpikeTunnels && settings.DarkRooms && settings.SpicySkips)
                        SendMessage("mode", "Hard");
                    else if (!settings.AcidSkips && !settings.FireballSkips && !settings.MildSkips && !settings.ShadeSkips && !settings.SpikeTunnels && !settings.DarkRooms &&!settings.SpicySkips)
                        SendMessage("mode", "Easy");
                    else
                        SendMessage("mode", "Custom");
                    
                    if (presetSuperJunkPit)
                        msgText = "Super Junk Pit";
                    else if (presetJunkPit)
                        msgText = "Junk Pit";
                    else if (presetCollector)
                        msgText = "Collector";
                    else if (presetCompletionist)
                        msgText = "Completionist";
                    else if (presetProgressive)
                        msgText = "Progressive";
                    else if (presetClassic)
                        msgText = "Classic";
                    else
                        msgText = $"Custom";

                    SendMessage("preset", msgText.Trim());

                }
            }
            catch
            {
                SendMessage("randomizer", "false");
            }
            SendMessage("bench", PlayerData.instance.respawnScene.ToString());
        }


        public void NewGame()
        {
            GetRandom();
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

    }
}
