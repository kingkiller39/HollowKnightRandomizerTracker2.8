using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Formatters.Binary;
using System.Security.Cryptography;
using System.Text;

namespace PlayerDataDump.StandAlone
{
    public class SaveGameManager
    {
        public void Load(string path)
        {
            BinaryFormatter binaryFormatter = new BinaryFormatter();
            FileStream fileStream = File.Open(path, FileMode.Open, FileAccess.Read, FileShare.Read);
            string toDecrypt = (string)binaryFormatter.Deserialize(fileStream);
            fileStream.Close();
            PlayerData.instance = JsonConvert.DeserializeObject<SaveGameData>(Decrypt(toDecrypt)).playerData;
        }

        private string Decrypt(string data)
        {
            return StringEncrypt.DecryptData(data);
        }

    }
}
