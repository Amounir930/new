# =============================================================================
#  APEX PROJECT COLLECTOR - FIXED EDITION 🛡️
#  يعمل تلقائياً في نفس مجلد السكربت
# =============================================================================

# 1. إعداد المسارات - يعمل في نفس المجلد مباشرة
$ProjectPath = $PSScriptRoot

if ([string]::IsNullOrEmpty($ProjectPath)) {
    $ProjectPath = (Get-Location).Path
}

Write-Host "📁 Working in: $ProjectPath" -ForegroundColor Cyan

# أسماء الملفات الناتجة
$MapFileName = "Project_Structure.txt"
$CodeFileName = "Project_Codebase.txt"

$MapFilePath = Join-Path $ProjectPath $MapFileName
$CodeFilePath = Join-Path $ProjectPath $CodeFileName

# 2. إعداد الفلاتر
$ExcludedFolders = @(
    "node_modules", ".git", ".idea", ".vscode", ".agent", "docs",".husky",".turbo","daemon"
    "dist", "build", "coverage", "update", "bin", "obj", 
    ".next", ".nest", "assets", "public", "uploads", ".github",
    "__pycache__", ".pytest_cache", "temp", "tmp", "logs"
)

$AllowedExtensions = "\.(ts|js|html|css|scss|md|py|cs|cpp|h|sql|prisma|sh|yml|yaml|xml|razor|jsx|tsx|vue|go|rs|php|rb)$"

$BlockedFileNames = @(
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    ".env", ".env.local", ".env.production",
    "npm-debug.log", ".DS_Store", "Thumbs.db" ,"All.ps1"
)

# 3. دالة استخراج الوصف
function Get-FileDescription {
    param([string]$FilePath)
    try {
        $Lines = Get-Content -Path $FilePath -TotalCount 10 -ErrorAction SilentlyContinue
        foreach ($Line in $Lines) {
            $l = $Line.Trim()
            if ([string]::IsNullOrWhiteSpace($l)) { continue }
            if ($l -match "^(import|package|require|const|let|var|export|class|interface|type|async|function|return|namespace|using)") { 
                if ($l -notmatch "^@") { return "" }
            }
            if ($l.StartsWith("//") -or $l.StartsWith("/*") -or $l.StartsWith("*") -or $l.StartsWith("#")) {
                $clean = $l -replace "^/{2,}\s*", "" -replace "^\/\*+\s*", "" -replace "^\*\s*", "" -replace "\*\/$", "" -replace "^#\s*", ""
                if ($clean.Length -gt 4 -and $clean -notmatch "^eslint") { 
                    if ($clean.Length -gt 50) { $clean = $clean.Substring(0, 47) + "..." }
                    return " ➤ $clean" 
                }
            }
            if ($l -match "@Controller") { return " ➤ [API Endpoint]" }
            if ($l -match "@Injectable") { return " ➤ [Service Logic]" }
            if ($l -match "@Entity") { return " ➤ [Database Entity]" }
        }
    } catch {}
    return ""
}

# 4. تنظيف الملفات القديمة
if (Test-Path $MapFilePath) { Remove-Item $MapFilePath -Force -ErrorAction SilentlyContinue }
if (Test-Path $CodeFilePath) { Remove-Item $CodeFilePath -Force -ErrorAction SilentlyContinue }

# 5. جمع الملفات
Write-Host "🔍 Scanning Directory..." -ForegroundColor Cyan

$AllFiles = Get-ChildItem -Path $ProjectPath -Recurse -File | 
    Where-Object { 
        $File = $_
        
        # تجاهل ملفات التصدير نفسها
        if ($File.Name -eq $MapFileName -or $File.Name -eq $CodeFileName) { return $false }
        
        # حساب المسار النسبي
        $RelPath = $File.FullName.Substring($ProjectPath.Length).TrimStart('\', '/')
        
        # فلتر المجلدات - التصحيح هنا!
        $IsExcluded = $false
        foreach ($folder in $ExcludedFolders) {
            # استخدام -like بدلاً من Split
            if ($RelPath -like "*\$folder\*" -or $RelPath -like "*/$folder/*" -or $RelPath -eq $folder -or $RelPath.StartsWith("$folder\") -or $RelPath.StartsWith("$folder/")) {
                $IsExcluded = $true
                break
            }
        }
        if ($IsExcluded) { return $false }

        # فلتر الامتداد
        if ($File.Extension -notmatch $AllowedExtensions) { return $false }

        # فلتر الأسماء المحظورة
        if ($BlockedFileNames -contains $File.Name) { return $false }

        return $true
    }

if ($AllFiles.Count -eq 0) {
    Write-Host "❌ No files found!" -ForegroundColor Red
    exit
}

# 6. حساب الإحصائيات
Write-Host "📊 Calculating stats..." -ForegroundColor Yellow

$Stats = @{
    Files = $AllFiles.Count
    Lines = 0
    Words = 0
    Chars = 0
}

foreach ($File in $AllFiles) {
    try {
        $Text = [System.IO.File]::ReadAllText($File.FullName)
        $Stats.Chars += $Text.Length
        $Stats.Lines += $Text.Split("`n").Count
        $Stats.Words += $Text.Split([char[]]@(' ', "`t", "`n", "`r"), [StringSplitOptions]::RemoveEmptyEntries).Count
    } catch { 
        Write-Warning "Could not read: $($File.Name)" 
    }
}

$Stats.Tokens = [Math]::Round($Stats.Chars / 4)

# 7. إنشاء ملف الخريطة
Write-Host "🗺️  Generating structure..." -ForegroundColor Green

$MapStream = [System.IO.StreamWriter]::new($MapFilePath, $false, [System.Text.Encoding]::UTF8)

try {
    $MapStream.WriteLine("========================================================")
    $MapStream.WriteLine("PROJECT STRUCTURE MAP")
    $MapStream.WriteLine("========================================================")
    $MapStream.WriteLine("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')")
    $MapStream.WriteLine("Files: $($Stats.Files) | Lines: $("{0:N0}" -f $Stats.Lines) | Tokens: ~$("{0:N0}" -f $Stats.Tokens)")
    $MapStream.WriteLine("========================================================`n")

    function Write-DirTree {
        param([string]$Path, [string]$Indent)
        
        $Items = Get-ChildItem -Path $Path -ErrorAction SilentlyContinue | Where-Object {
            $n = $_.Name
            # تجاهل مجلدات المستبعدة
            if ($_.PSIsContainer) {
                return $n -notin $ExcludedFolders
            } else {
                # التحقق من الملفات فقط إذا كانت في قائمة AllFiles
                return ($AllFiles | Where-Object { $_.FullName -eq $_.FullName })
            }
        } | Sort-Object { $_.PSIsContainer } -Descending | Sort-Object Name
        
        $Count = $Items.Count
        $i = 0
        
        foreach ($Item in $Items) {
            $i++
            $IsLast = ($i -eq $Count)
            $Prefix = if ($IsLast) { "└── " } else { "├── " }
            $ChildIndent = if ($IsLast) { "    " } else { "│   " }
            
            if ($Item.PSIsContainer) {
                $MapStream.WriteLine("$Indent$Prefix📂 $($Item.Name)")
                Write-DirTree -Path $Item.FullName -Indent "$Indent$ChildIndent"
            } else {
                $Desc = Get-FileDescription -FilePath $Item.FullName
                $MapStream.WriteLine("$Indent$Prefix📄 $($Item.Name)$Desc")
            }
        }
    }
    
    Write-DirTree -Path $ProjectPath -Indent ""
}
finally { 
    $MapStream.Close() 
}

# 8. إنشاء ملف الأكواد
Write-Host "📦 Archiving code..." -ForegroundColor Green

$CodeStream = [System.IO.StreamWriter]::new($CodeFilePath, $false, [System.Text.Encoding]::UTF8)

try {
    $CodeStream.WriteLine("################################################################################")
    $CodeStream.WriteLine("# PROJECT CODEBASE ARCHIVE")
    $CodeStream.WriteLine("################################################################################")
    $CodeStream.WriteLine("# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')")
    $CodeStream.WriteLine("# Files: $($Stats.Files) | Lines: $("{0:N0}" -f $Stats.Lines) | Words: $("{0:N0}" -f $Stats.Words)")
    $CodeStream.WriteLine("# Chars: $("{0:N0}" -f $Stats.Chars) | Est.Tokens: $("{0:N0}" -f $Stats.Tokens)")
    $CodeStream.WriteLine("################################################################################`n")

    $Counter = 0
    foreach ($File in $AllFiles) {
        $Counter++
        $Percent = [math]::Round(($Counter / $Stats.Files) * 100)
        Write-Progress -Activity "Exporting" -Status "$($File.Name)" -PercentComplete $Percent

        $SafePath = $File.FullName.Substring($ProjectPath.Length).Replace("\", "/")

        $CodeStream.WriteLine("`n/*==============================================================================")
        $CodeStream.WriteLine(" FILE: $($File.Name)")
        $CodeStream.WriteLine(" PATH: .$SafePath")
        $CodeStream.WriteLine("==============================================================================*/")
        
        try {
            $Content = [System.IO.File]::ReadAllText($File.FullName)
            $CodeStream.WriteLine($Content)
        } catch { 
            $CodeStream.WriteLine("[ERROR READING FILE]") 
        }
    }
}
finally { 
    $CodeStream.Close()
    Write-Progress -Activity "Exporting" -Completed
}

Write-Host "`n✅ SUCCESS!" -ForegroundColor Green
Write-Host "   📄 Structure: $MapFileName" -ForegroundColor Cyan
Write-Host "   📦 Code:      $CodeFileName" -ForegroundColor Cyan
Write-Host "   📊 Tokens:    $("{0:N0}" -f $Stats.Tokens)" -ForegroundColor Yellow