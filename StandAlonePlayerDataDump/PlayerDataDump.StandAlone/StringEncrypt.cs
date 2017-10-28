using System;
using System.Security.Cryptography;
using System.Text;

namespace PlayerDataDump.StandAlone
{
    // This was pulled out of the HK DLL
    public class StringEncrypt
    {
        
        public static string EncryptData(string toEncrypt)
        {
            byte[] bytes = Encoding.UTF8.GetBytes(toEncrypt);
            ICryptoTransform cryptoTransform = new RijndaelManaged
            {
                Key = keyArray,
                Mode = CipherMode.ECB,
                Padding = PaddingMode.PKCS7
            }.CreateEncryptor();
            byte[] array = cryptoTransform.TransformFinalBlock(bytes, 0, bytes.Length);
            return Convert.ToBase64String(array, 0, array.Length);
        }

        
        public static string DecryptData(string toDecrypt)
        {
            byte[] array = Convert.FromBase64String(toDecrypt);
            ICryptoTransform cryptoTransform = new RijndaelManaged
            {
                Key = keyArray,
                Mode = CipherMode.ECB,
                Padding = PaddingMode.PKCS7
            }.CreateDecryptor();
            byte[] bytes = cryptoTransform.TransformFinalBlock(array, 0, array.Length);
            return Encoding.UTF8.GetString(bytes);
        }

        // Token: 0x04002F18 RID: 12056
        private static byte[] keyArray = Encoding.UTF8.GetBytes("UKu52ePUBwetZ9wNX88o54dnfKRu0T1l");
    }

}
