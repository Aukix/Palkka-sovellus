Set FSO = CreateObject("Scripting.FileSystemObject")
ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = ScriptDir

Q = Chr(34)
NodePath = "node"
If FSO.FileExists("C:\Program Files\nodejs\node.exe") Then
    NodePath = "C:\Program Files\nodejs\node.exe"
ElseIf FSO.FileExists(WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Programs\nodejs\node.exe") Then
    NodePath = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Programs\nodejs\node.exe"
End If

cmdStr = Q & NodePath & Q & " " & Q & ScriptDir & "\server.cjs" & Q
WshShell.Run cmdStr, 0, False
