using System.Collections.Generic;
using System.Linq;
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
            randoAtBench = false;
            randoHasLeftDash = false;
            randoHasRightDash = false;
            randoHasLeftClaw = false;
            randoHasRightClaw = false;
            randoHasUpSlash = false;
            randoHasLeftSlash = false;
            randoHasRightSlash = false;
            randoHasSwim = false;
            randoHasElevatorPass = false;
            randoHasDreamer = false;
        }

        private static readonly HashSet<string> IntKeysToSend = new HashSet<string> {"simpleKeys", "nailDamage", "maxHealth", "MPReserveMax", "ore", "rancidEggs", "grubsCollected", "charmSlotsFilled", "charmSlots", "flamesCollected" };
        private static readonly string[] LeftCloak = new string[] { "Left_Mothwing_Cloak", "Left_Mothwing_Cloak_(1)", "Left_Shade_Cloak", "Left_Shade_Cloak_(1)" };
        private static readonly string[] RightCloack = new string[] { "Right_Mothwing_Cloak", "Right_Mothwing_Cloak_(1)", "Right_Shade_Cloak", "Right_Shade_Cloak_(1)" };
        private static readonly string[] ElevatorPass = new string[] { "ElevatorPass", "Elevator_Pass" };
        private bool randoAtBench { get; set; }
        private bool randoHasLeftDash { get; set; }
        private bool randoHasRightDash { get; set; }
        private bool randoHasLeftClaw { get; set; }
        private bool randoHasRightClaw { get; set; }
        private bool randoHasUpSlash { get; set; }
        private bool randoHasLeftSlash { get; set; }
        private bool randoHasRightSlash { get; set; }
        private bool randoHasSwim { get; set; }
        private bool randoHasElevatorPass { get; set; }
        private bool randoHasDreamer { get; set; }
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
                    randoHasLeftDash = randoHasRightDash = randoHasLeftClaw = randoHasRightClaw = randoHasUpSlash = randoHasLeftSlash = randoHasRightSlash = randoHasSwim = randoHasElevatorPass = randoHasDreamer = false;
                    Send(GetJson());
                    GetRandom();
                    SplitItems();
                    getCursedNail();
                    getSwim();
                    getElevatorPass();
                    getDreamer();
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
            ModHooks.Instance.AfterSavegameLoadHook -= LoadSave;
            ModHooks.Instance.SetPlayerBoolHook -= EchoBool;
            ModHooks.Instance.SetPlayerIntHook -= EchoInt;
            On.GameMap.Start -= gameMapStart;
            ModHooks.Instance.ApplicationQuitHook -= OnQuit;
            randoHasLeftDash = randoHasRightDash = randoHasLeftClaw = randoHasRightClaw = randoHasUpSlash = randoHasLeftSlash = randoHasRightSlash = randoHasSwim = randoHasElevatorPass = randoHasDreamer = false;
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

        public void LoadSave(SaveGameData data)
        {
            if (State != WebSocketState.Open) return;
            PlayerDataDump.Instance.LogDebug("Loaded Save");
            randoHasLeftDash = randoHasRightDash = randoHasLeftClaw = randoHasRightClaw = randoHasUpSlash = randoHasLeftSlash = randoHasRightSlash = randoHasSwim = randoHasElevatorPass = randoHasDreamer = false;
            GetRandom();
            SendMessage("SaveLoaded", "true");
        }
        public void LoadSave()
        {
            if (State != WebSocketState.Open) return;
            GetRandom();
            SendMessage("SaveLoaded", "true");
        }

        public void EchoBool(string var, bool value)
        {
            PlayerDataDump.Instance.LogDebug($"EchoBool: {var} = {value}");
            if (var == "atBench" && value && !randoAtBench)
            {
                
                LoadSave();
                SendMessage("bench", PlayerData.instance.respawnScene.ToString());
                randoAtBench = true;
            }
            else if (var == "atBench" && !value && randoAtBench)
            {
                randoAtBench = false;
            }
            if (var == "RandomizerMod.Monomon" || var == "AreaRando.Monomon")
            {
                var= "maskBrokenMonomon";
            }
            else if (var == "RandomizerMod.Lurien" || var == "AreaRando.Lurien")
            {
                var= "maskBrokenLurien";
            }
            else if (var == "RandomizerMod.Herrah" || var == "AreaRando.Herrah")
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
            if (var == "canDashRight" || var == "canDashLeft")
            {
                SendMessage(var, value.ToString());
                SendMessage("hasDash", "true");
            }
            else if (var == "hasWalljumpRight" || var == "hasWalljumpLeft")
            {
                SendMessage(var, value.ToString());
                SendMessage("hasWalljump", "true");
            }
            else if (var.StartsWith("RandomizerMod.has") || var.StartsWith("gotCharm_") || var.StartsWith("brokenCharm_") || var.StartsWith("equippedCharm_") || var.StartsWith("has") || var.StartsWith("maskBroken") || var == "overcharmed" || var.StartsWith("used") || var.StartsWith("opened") || var.StartsWith("gave") || var == "unlockedCompletionRate")
            {
                SendMessage(var, value.ToString());
            }

            PlayerData.instance.SetBoolInternal(var, value);
            if (RandomizerMod.RandomizerMod.Instance.Settings.CursedNail) getCursedNail();
            if (RandomizerMod.RandomizerMod.Instance.Settings.RandomizeSwim) getSwim();
            if (RandomizerMod.RandomizerMod.Instance.Settings.ElevatorPass) getElevatorPass();
            if (RandomizerMod.RandomizerMod.Instance.Settings.DuplicateMajorItems) getDreamer();
        }

       public void EchoInt(string var, int value)
        {
            PlayerDataDump.Instance.LogDebug($"EchoInt: {var} = {value}");
            if ( var == "royalCharmState" && (value == 1 || value == 2 || value == 3 || value == 4 ))
            {
                EchoBool("gotCharm_36", true);
            }
            if (IntKeysToSend.Contains(var) || var.EndsWith("Level") || var.StartsWith("trinket") || var == "nailSmithUpgrades" || var == "rancidEggs" || var == "royalCharmState" || var == "dreamOrbs")
            {
                SendMessage(var, value.ToString());
            }
            PlayerData.instance.SetIntInternal(var, value);
        }

        public string GetJson()
        {
            PlayerData playerData = PlayerData.instance;
            string json = JsonUtility.ToJson(playerData);
            return json;
        }

        public void SplitItems()
        {
            if (RandomizerMod.RandomizerMod.Instance.Settings.RandomizeCloakPieces) { getSplitDash(); }
            if (RandomizerMod.RandomizerMod.Instance.Settings.RandomizeClawPieces) { getSplitClaw(); }
            
            PlayerData playerData = PlayerData.instance;
            if (playerData.GetBool("hasDash") || playerData.GetBool("hasDashAny")) SendMessage("hasDash", "true");
            if (playerData.GetBool("hasWalljump") || playerData.GetBool("hasWalljumpAny")) SendMessage("hasWalljump", "true");
        }

        public void getSplitDash()
        {
            if (!RandomizerMod.RandomizerMod.Instance.Settings.RandomizeCloakPieces) return;
            if (RightCloack.Intersect(RandomizerMod.RandomizerMod.Instance.Settings.GetItemsFound()).Any() && !randoHasRightDash)
            {
                randoHasRightDash = true;
                SendMessage("canDashRight", "true");
            }

            if (LeftCloak.Intersect(RandomizerMod.RandomizerMod.Instance.Settings.GetItemsFound()).Any() && !randoHasLeftDash)
            {
                randoHasLeftDash = true;
                SendMessage("canDashLeft", "true");
            }
        }

        public void getSplitClaw()
        {
            if (!RandomizerMod.RandomizerMod.Instance.Settings.RandomizeClawPieces) return;
            if (PlayerData.instance.GetBool("hasWalljumpRight") && !randoHasRightClaw)
            {
                randoHasRightClaw = true;
                SendMessage("hasWalljumpRight", "true");
            }

            if (PlayerData.instance.GetBool("hasWalljumpLeft") && !randoHasLeftClaw)
            {
                randoHasLeftClaw = true;
                SendMessage("hasWalljumpLeft", "true");
            }
        }

        public void getCursedNail()
        {
            if (!RandomizerMod.RandomizerMod.Instance.Settings.CursedNail) return;
            if (RandomizerMod.RandomizerMod.Instance.Settings.GetItemsFound().Any("Upslash".Contains) && !randoHasUpSlash)
            {
                randoHasUpSlash = true;
                SendMessage("Upslash", "true");
            }

            if (RandomizerMod.RandomizerMod.Instance.Settings.GetItemsFound().Any("Leftslash".Contains) && !randoHasLeftSlash)
            {
                randoHasLeftSlash = true;
                SendMessage("Leftslash", "true");
            }

            if (RandomizerMod.RandomizerMod.Instance.Settings.GetItemsFound().Any("Rightslash".Contains) && !randoHasRightSlash)
            {
                randoHasRightSlash = true;
                SendMessage("Rightslash", "true");
            }
        }

        public void getSwim()
        {
            if (!RandomizerMod.RandomizerMod.Instance.Settings.RandomizeSwim) return;
            if (RandomizerMod.RandomizerMod.Instance.Settings.GetItemsFound().Any("Swim".Contains) && !randoHasSwim)
            {
                randoHasSwim = true;
                SendMessage("swim", "true");
            }
        }

        public void getElevatorPass()
        {
            if (!RandomizerMod.RandomizerMod.Instance.Settings.ElevatorPass) return;
            if (ElevatorPass.Intersect(RandomizerMod.RandomizerMod.Instance.Settings.GetItemsFound()).Any() && !randoHasElevatorPass)
            {
                randoHasElevatorPass = true;
                SendMessage("elevatorPass", "true");
            }
        }
        
        public void getDreamer()
        {
            if (!RandomizerMod.RandomizerMod.Instance.Settings.DuplicateMajorItems) return;
            if (RandomizerMod.RandomizerMod.Instance.Settings.GetItemsFound().Any(s => s.Contains("Dreamer")) && !randoHasDreamer)
            {
                randoHasDreamer = true;
                SendMessage("DuplicateDreamer", "true");
                SendMessage("dreamersDupe", "true");
                
            }
        }

        public void GetRandom()
        {
            if (State != WebSocketState.Open) return;
            try
            {
                var settings = RandomizerMod.RandomizerMod.Instance.Settings;
                if (settings.Randomizer)
                {
                    if (settings.CursedNail)
                    {
                        SendMessage("Downslash", "true");
                    }
                    else
                    {
                        SendMessage("FullNail", "true");
                    }
                    if (!settings.ElevatorPass) SendMessage("elevatorPass", "true");
                    if (!settings.RandomizeSwim) SendMessage("swim", "true");
                    if (!settings.DuplicateMajorItems) SendMessage("DupesOff", "true");
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

                    // Preset reference:
                    // https://github.com/flibber-hk/HollowKnight.RandomizerMod/blob/6d46547e79a1d472791070477aa18450f3364363/RandomizerMod3.0/MenuChanger.cs#L269

                    // "Standard", formerly "Super Mini Junk Pit"
                    // "Junk Pit" was this minus Stags
                    bool selectionsTrueStandard =
                        settings.RandomizeDreamers &&
                        settings.RandomizeSkills &&
                        settings.RandomizeCharms &&
                        settings.RandomizeKeys &&
                        settings.RandomizeGeoChests &&
                        settings.RandomizeMaskShards &&
                        settings.RandomizeVesselFragments &&
                        settings.RandomizePaleOre &&
                        settings.RandomizeCharmNotches &&
                        settings.RandomizeRancidEggs &&
                        settings.RandomizeRelics &&
                        settings.RandomizeStags;

                    // "Super", formerly "Super Junk Pit"
                    bool selectionsTrueSuper =
                        selectionsTrueStandard &&
                        settings.RandomizeMaps &&
                        settings.RandomizeGrubs &&
                        settings.RandomizeWhisperingRoots;

                    // "LifeTotems"
                    bool selectionsTrueLifeTotems =
                        selectionsTrueStandard &&
                        settings.RandomizeLifebloodCocoons &&
                        settings.RandomizeSoulTotems &&
                        settings.RandomizePalaceTotems &&
                        settings.RandomizeBossGeo;

                    // "Spoiler DAB" (Double Anti Bingo)
                    bool selectionsTrueSpoilerDAB =
                        selectionsTrueStandard &&
                        settings.RandomizeMaps &&
                        settings.RandomizeWhisperingRoots &&
                        settings.RandomizeLifebloodCocoons &&
                        settings.RandomizeSoulTotems;


                    // new age set - stuff added more recently
                    bool selectionsFalseNewAgeSet =
                        !settings.RandomizeLoreTablets &&
                        !settings.RandomizePalaceTablets &&
                        !settings.RandomizeGrimmkinFlames;

                    // junk set - stuff that Super adds to Standard
                    bool selectionsFalseJunkSet =
                        !settings.RandomizeMaps &&
                        !settings.RandomizeGrubs &&
                        !settings.RandomizeWhisperingRoots;

                    // "Super"
                    bool selectionsFalseSuper =
                        !settings.RandomizeRocks &&
                        !settings.RandomizeLifebloodCocoons &&
                        !settings.RandomizeSoulTotems &&
                        !settings.RandomizePalaceTotems &&
                        selectionsFalseNewAgeSet;

                    // "Standard"
                    bool selectionsFalseStandard =
                        selectionsFalseJunkSet &&
                        selectionsFalseSuper;

                    // "LifeTotems"
                    bool selectionsFalseLifeTotems =
                        selectionsFalseJunkSet &&
                        !settings.RandomizeRocks &&
                        !settings.RandomizeLoreTablets &&
                        !settings.RandomizePalaceTablets &&
                        !settings.RandomizeGrimmkinFlames &&
                        !settings.RandomizeBossEssence;

                    // "Spoiler DAB"
                    bool selectionsFalseSpoilerDAB =
                        !settings.RandomizeGrubs &&
                        !settings.RandomizeRocks &&
                        !settings.RandomizePalaceTotems &&
                        selectionsFalseNewAgeSet;

                    bool presetStandard = selectionsTrueStandard && selectionsFalseStandard;
                    bool presetSuper = selectionsTrueSuper && selectionsFalseSuper;
                    bool presetLifeTotems = selectionsTrueLifeTotems && selectionsFalseLifeTotems;
                    bool presetSpoilerDAB = selectionsTrueSpoilerDAB && selectionsFalseSpoilerDAB;

                    // "EVERYTHING" in aggressive all-caps
                    bool presetEverything =
                        selectionsTrueSuper &&
                        selectionsTrueLifeTotems &&
                        selectionsTrueSpoilerDAB &&
                        settings.RandomizeRocks &&
                        settings.RandomizeLoreTablets &&
                        settings.RandomizeGrimmkinFlames &&
                        settings.RandomizeBossEssence &&
                        settings.RandomizeBossGeo;

                    SendMessage("seed", settings.Seed.ToString());
                    if (settings.AcidSkips && settings.FireballSkips && settings.MildSkips && settings.ShadeSkips && settings.SpikeTunnels && settings.DarkRooms && settings.SpicySkips)
                        SendMessage("mode", "Hard");
                    else if (!settings.AcidSkips && !settings.FireballSkips && !settings.MildSkips && !settings.ShadeSkips && !settings.SpikeTunnels && !settings.DarkRooms && !settings.SpicySkips)
                        SendMessage("mode", "Easy");
                    else
                        SendMessage("mode", "Custom");

                    if (presetStandard)
                        msgText = "Standard";
                    else if (presetSuper)
                        msgText = "Super";
                    else if (presetLifeTotems)
                        msgText = "LifeTotems";
                    else if (presetSpoilerDAB)
                        msgText = "Spoiler DAB";
                    else if (presetEverything)
                        msgText = "EVERYTHING";
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
            if (State != WebSocketState.Open) return;
            PlayerDataDump.Instance.LogDebug("Loaded New Save");
            randoHasLeftDash = randoHasRightDash = randoHasLeftClaw = randoHasRightClaw = randoHasUpSlash = randoHasLeftSlash = randoHasRightSlash = randoHasSwim = randoHasElevatorPass = randoHasDreamer = false;
            GetRandom();
            SendMessage("NewSave", "true");
        }

        public void gameMapStart(On.GameMap.orig_Start orig, GameMap self)
        {
            orig(self);
            if (State != WebSocketState.Open) return;
            randoHasLeftDash = randoHasRightDash = randoHasLeftClaw = randoHasRightClaw = randoHasUpSlash = randoHasLeftSlash = randoHasRightSlash = randoHasSwim = randoHasElevatorPass = randoHasDreamer = false;
            GetRandom();
            SendMessage("NewSave", "true");
        }

        public void OnQuit()
        {
            if (State != WebSocketState.Open) return;
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
