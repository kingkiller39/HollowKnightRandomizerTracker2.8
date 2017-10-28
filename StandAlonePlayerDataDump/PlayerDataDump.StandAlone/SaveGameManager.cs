using Newtonsoft.Json;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;

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

        private static string Decrypt(string data)
        {
            return StringEncrypt.DecryptData(data);
        }

    }
}
