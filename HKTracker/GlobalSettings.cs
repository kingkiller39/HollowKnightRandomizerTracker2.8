using System;

namespace HKTracker
{
    public class GlobalSettings
    {
        public static event Action StyleEvent;
        public static event Action PresetEvent;
        public static event Action GlowEvent;
        public enum Style
        {
            Classic,
            Modern
        }
        public enum Profile
        {
            PlayerCustom1,
            PlayerCustom2,
            PlayerCustom3,
            Everything,
            Minimal_Left,
            Minimal_Right,
            Rando_Racing
        }
        public enum BorderGlow
        {
            On,
            Off
        }
        public Style _TrackerStyle = Style.Classic;
        public Profile _TrackerProfile = Profile.PlayerCustom1;
        public BorderGlow _TrackerGlow = BorderGlow.On;
        public Style TrackerStyle
        {
            get
            {
                return _TrackerStyle;
            }
            set
            {
                if(value != _TrackerStyle)
                {
                    _TrackerStyle = value;
                    StyleEvent();
                }
            }
        }
        public Profile TrackerProfile
        {
            get
            {
                return _TrackerProfile;
            }
            set
            {
                if (value != _TrackerProfile)
                {
                    _TrackerProfile = value;
                    PresetEvent();
                }
            }
        }
        public BorderGlow TrackerGlow
        {
            get
            {
                return _TrackerGlow;
            }
            set
            {
                if (value != _TrackerGlow)
                {
                    _TrackerGlow = value;
                    GlowEvent();
                }
            }
        }
        

    }
}
