Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\bsaik\Desktop\Capstone\pipeline-main"
WshShell.Run "node tunnel-watchdog.cjs", 0, False
