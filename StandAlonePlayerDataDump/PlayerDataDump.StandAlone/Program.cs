using System;

namespace PlayerDataDump.StandAlone
{
    internal class Program
    {
        private static void Main(string[] args)
        {
            PlayerDataDump dump = new PlayerDataDump();
            dump.Initialize();
            Console.ReadLine();
        }
    }
}
