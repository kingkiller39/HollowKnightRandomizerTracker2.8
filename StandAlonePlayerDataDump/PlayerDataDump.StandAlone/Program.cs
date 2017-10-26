using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PlayerDataDump.StandAlone
{
    class Program
    {
        static void Main(string[] args)
        {
            PlayerDataDump dump = new PlayerDataDump();
            dump.Initialize();
            Console.ReadLine();
        }
    }
}
