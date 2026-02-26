# =============================================================================
#  APEX PROJECT COLLECTOR - ENTERPRISE EDITION 🏭
#  للمشاريع الضخمة - يدعم ملفات غير محدودة الحجم
# =============================================================================

# 1. إعداد المسارات
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

# 2. الإعدادات المتقدمة
$MaxFileSizeMB = 2                          # الحد الأقصى لكل جزء (2MB)
$MaxFileSizeBytes = $MaxFileSizeMB * 1MB
$LargeFileThreshold = 500KB                 # الملفات الكبيرة تستخدم Streaming

$ExcludedFolders = @(
    "node_modules", ".git", ".idea", ".vscode", ".agent", "docs", ".husky", ".turbo", "daemon" , "meta"
    "dist", "build", "coverage", "update", "bin", "obj","db" 
    ".next", ".nest", "assets", "public", "uploads", ".github",
    "__pycache__", ".pytest_cache", "temp", "tmp", "logs", "out", ".output"
)

$AllowedExtensions = "\.(ts|js|html|css|scss|java|py|cs|cpp|h|sql|prisma|sh|yml|yaml|xml|razor|jsx|tsx|vue|go|rs|php|rb|kt|swift|m|scala|r|pl|lua|dockerfile|gitignore)$"

$BlockedFileNames = @(
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "package.json", "tsconfig.json",
    ".env", ".env.local", ".env.production", ".env.development",
    "npm-debug.log", ".DS_Store", "Thumbs.db", "All.ps1", 
    "Project_Structure.txt", "Project_Codebase.txt"
)

# 3. دالة استخراج الوصف (محسنة للملفات الكبيرة)
function Get-FileDescription {
    param([string]$FilePath)
    try {
        # استخدام StreamReader للملفات الكبيرة جداً
        $Stream = [System.IO.StreamReader]::new($FilePath, [System.Text.Encoding]::UTF8)
        $LineCount = 0
        $Description = ""
        
        while ($null -ne ($Line = $Stream.ReadLine()) -and $LineCount -lt 20) {
            $LineCount++
            $l = $Line.Trim()
            if ([string]::IsNullOrWhiteSpace($l)) { continue }
            
            # تخطي الأسطر البرمجية
            if ($l -match "^(import|package|require|const|let|var|export|class|interface|type|async|function|return|namespace|using|#include|from)") { 
                if ($l -notmatch "^@") { continue }
            }
            
            # استخراج التعليقات
            if ($l.StartsWith("//") -or $l.StartsWith("/*") -or $l.StartsWith("*") -or $l.StartsWith("#")) {
                $clean = $l -replace "^/{2,}\s*", "" -replace "^\/\*+\s*", "" -replace "^\*\s*", "" -replace "\*\/$", "" -replace "^#\s*", ""
                if ($clean.Length -gt 4 -and $clean -notmatch "^(eslint|tslint|jshint|pragma)") { 
                    if ($clean.Length -gt 80) { $clean = $clean.Substring(0, 77) + "..." }
                    $Description = " ➤ $clean"
                    break
                }
            }
            
            # Decorators شائعة
            if ($l -match "@Controller") { $Description = " ➤ [API Controller]"; break }
            if ($l -match "@Injectable|@Service") { $Description = " ➤ [Service]"; break }
            if ($l -match "@Entity|@Table") { $Description = " ➤ [DB Entity]"; break }
            if ($l -match "@Module") { $Description = " ➤ [Module]"; break }
            if ($l -match "@Component|@Injectable") { $Description = " ➤ [Component]"; break }
        }
        
        $Stream.Close()
        return $Description
    } catch { 
        return ""
    }
}

# 4. تنظيف الملفات القديمة والأجزاء المنقسمة
Write-Host "🧹 Cleaning old exports..." -ForegroundColor Yellow
Get-ChildItem -Path $ProjectPath -Name "Project_Codebase_Part*.txt" -ErrorAction SilentlyContinue | 
    ForEach-Object { Remove-Item (Join-Path $ProjectPath $_) -Force -ErrorAction SilentlyContinue }

if (Test-Path $MapFilePath) { Remove-Item $MapFilePath -Force -ErrorAction SilentlyContinue }
if (Test-Path $CodeFilePath) { Remove-Item $CodeFilePath -Force -ErrorAction SilentlyContinue }

# 5. جمع الملفات مع معالجة الذاكرة
Write-Host "🔍 Scanning Directory (Optimized for large files)..." -ForegroundColor Cyan

$AllFiles = Get-ChildItem -Path $ProjectPath -Recurse -File | 
    Where-Object { 
        $File = $_
        
        if ($File.Name -eq $MapFileName -or $File.Name -eq $CodeFileName) { return $false }
        if ($BlockedFileNames -contains $File.Name) { return $false }
        
        $RelPath = $File.FullName.Substring($ProjectPath.Length).TrimStart('\', '/')
        
        # فلتر المجلدات
        foreach ($folder in $ExcludedFolders) {
            if ($RelPath -like "*\$folder\*" -or $RelPath -like "*/$folder/*" -or 
                $RelPath -eq $folder -or $RelPath.StartsWith("$folder\") -or $RelPath.StartsWith("$folder/")) {
                return $false
            }
        }

        if ($File.Extension -notmatch $AllowedExtensions) { return $false }
        
        return $true
    } | Sort-Object FullName

if ($AllFiles.Count -eq 0) {
    Write-Host "❌ No files found!" -ForegroundColor Red
    exit
}

Write-Host "   Found $($AllFiles.Count) files" -ForegroundColor Green

# 6. حساب الإحصائيات (Streaming للملفات الكبيرة)
Write-Host "📊 Calculating stats (Large file optimized)..." -ForegroundColor Yellow

$Stats = @{
    Files = $AllFiles.Count
    Lines = [long]0
    Words = [long]0
    Chars = [long]0
    TotalSize = [long]0
    LargeFiles = 0
}

foreach ($File in $AllFiles) {
    try {
        $Stats.TotalSize += $File.Length
        
        if ($File.Length -gt $LargeFileThreshold) {
            $Stats.LargeFiles++
            # Streaming للملفات الكبيرة
            $Stream = [System.IO.StreamReader]::new($File.FullName, [System.Text.Encoding]::UTF8)
            while ($null -ne $Stream.ReadLine()) {
                $Stats.Lines++
            }
            $Stream.Close()
            
            # قراءة جزء صغير للحصول على الكلمات والأحرف بدقة تقريبية
            $Sample = [System.IO.File]::ReadAllText($File.FullName, [System.Text.Encoding]::UTF8)
            $Stats.Chars += $Sample.Length
            $Stats.Words += $Sample.Split([char[]]@(' ', "`t", "`n", "`r"), [StringSplitOptions]::RemoveEmptyEntries).Count
        } else {
            # الملفات الصغيرة: قراءة كاملة
            $Text = [System.IO.File]::ReadAllText($File.FullName, [System.Text.Encoding]::UTF8)
            $Stats.Chars += $Text.Length
            $Stats.Lines += $Text.Split("`n").Count
            $Stats.Words += $Text.Split([char[]]@(' ', "`t", "`n", "`r"), [StringSplitOptions]::RemoveEmptyEntries).Count
        }
    } catch { 
        Write-Warning "Could not read: $($File.Name)" 
    }
}

$Stats.Tokens = [Math]::Round($Stats.Chars / 4)

# 7. إنشاء ملف الخريطة
Write-Host "🗺️  Generating structure map..." -ForegroundColor Green

$MapStream = [System.IO.StreamWriter]::new($MapFilePath, $false, [System.Text.Encoding]::UTF8)

try {
    $MapStream.WriteLine("=" * 80)
    $MapStream.WriteLine("PROJECT STRUCTURE MAP - ENTERPRISE EDITION")
    $MapStream.WriteLine("=" * 80)
    $MapStream.WriteLine("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
    $MapStream.WriteLine("Files: $($Stats.Files) | Lines: $("{0:N0}" -f $Stats.Lines) | Tokens: ~$("{0:N0}" -f $Stats.Tokens)")
    $MapStream.WriteLine("Total Size: $("{0:N2}" -f ($Stats.TotalSize / 1MB)) MB | Large Files (>500KB): $($Stats.LargeFiles)")
    $MapStream.WriteLine("=" * 80)
    $MapStream.WriteLine("")

    function Write-DirTree {
        param([string]$Path, [string]$Indent)
        
        $Items = Get-ChildItem -Path $Path -ErrorAction SilentlyContinue | Where-Object {
            $n = $_.Name
            if ($_.PSIsContainer) {
                return $n -notin $ExcludedFolders
            } else {
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
                $MapStream.WriteLine("$Indent$Prefix📂 $($Item.Name)/")
                Write-DirTree -Path $Item.FullName -Indent "$Indent$ChildIndent"
            } else {
                $Size = if ($Item.Length -gt 1MB) { 
                    " [$("{0:N1}" -f ($Item.Length/1MB)) MB]" 
                } elseif ($Item.Length -gt 1KB) { 
                    " [$("{0:N0}" -f ($Item.Length/1KB)) KB]" 
                } else { 
                    " [$($Item.Length) B]" 
                }
                
                $Desc = Get-FileDescription -FilePath $Item.FullName
                $MapStream.WriteLine("$Indent$Prefix📄 $($Item.Name)$Size$Desc")
            }
        }
    }
    
    Write-DirTree -Path $ProjectPath -Indent ""
}
finally { 
    $MapStream.Close() 
}

# 8. إنشاء ملف الأكواد مع دعم التقسيم التلقائي
Write-Host "📦 Archiving code (Smart Splitting Enabled)..." -ForegroundColor Green

$CurrentPart = 1
$CurrentSize = 0
$CurrentFile = $CodeFilePath -replace "\.txt$", "_Part$CurrentPart.txt"
$CodeStream = [System.IO.StreamWriter]::new($CurrentFile, $false, [System.Text.Encoding]::UTF8)

$PartFiles = @($CurrentFile)

try {
    # كتابة الهيدر
    $Header = @"
################################################################################
# PROJECT CODEBASE ARCHIVE - PART $CurrentPart
################################################################################
# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# Files: $($Stats.Files) | Lines: $("{0:N0}" -f $Stats.Lines) | Words: $("{0:N0}" -f $Stats.Words)
# Chars: $("{0:N0}" -f $Stats.Chars) | Est.Tokens: $("{0:N0}" -f $Stats.Tokens)
# Total Size: $("{0:N2}" -f ($Stats.TotalSize / 1MB)) MB
# Split Threshold: $MaxFileSizeMB MB per file
################################################################################

"@
    $CodeStream.Write($Header)
    $CurrentSize = $Header.Length

    $Counter = 0
    foreach ($File in $AllFiles) {
        $Counter++
        $Percent = [math]::Round(($Counter / $Stats.Files) * 100)
        Write-Progress -Activity "Exporting Large Project" -Status "File $Counter of $($Stats.Files): $($File.Name)" -PercentComplete $Percent

        $SafePath = $File.FullName.Substring($ProjectPath.Length).Replace("\", "/")
        $FileSize = $File.Length
        
        # التحقق من الحجم قبل الكتابة
        $Separator = @"

/*==============================================================================
 FILE: $($File.Name) | Size: $("{0:N2}" -f ($FileSize/1KB)) KB | Lines: $(if($FileSize -gt $LargeFileThreshold) {"Large"} else {"Standard"})
 PATH: .$SafePath
==============================================================================*/
"@
        
        # إذا كان الملف الحالي + الفاصل + المحتوى سيتجاوز الحد، أنشئ جزءاً جديداً
        $EstimatedSize = $CurrentSize + $Separator.Length + $FileSize
        
        if ($EstimatedSize -gt $MaxFileSizeBytes -and $CurrentSize -gt 0) {
            $CodeStream.Close()
            
            $CurrentPart++
            $CurrentFile = $CodeFilePath -replace "\.txt$", "_Part$CurrentPart.txt"
            $CodeStream = [System.IO.StreamWriter]::new($CurrentFile, $false, [System.Text.Encoding]::UTF8)
            $PartFiles += $CurrentFile
            
            $PartHeader = @"
################################################################################
# PROJECT CODEBASE ARCHIVE - PART $CurrentPart (CONTINUED)
################################################################################
# Continued from Part $($CurrentPart-1)
################################################################################

"@
            $CodeStream.Write($PartHeader)
            $CurrentSize = $PartHeader.Length
            
            Write-Host "   📝 Created Part $CurrentPart..." -ForegroundColor Cyan
        }

        $CodeStream.WriteLine($Separator)
        $CurrentSize += $Separator.Length

        # كتابة المحتوى
        try {
            if ($FileSize -gt $LargeFileThreshold) {
                # Streaming للملفات الكبيرة (10,000+ سطر)
                $FileStream = [System.IO.StreamReader]::new($File.FullName, [System.Text.Encoding]::UTF8)
                $Buffer = New-Object char[] 4096
                $ReadCount = 0
                
                while (($ReadCount = $FileStream.Read($Buffer, 0, $Buffer.Length)) -gt 0) {
                    $CodeStream.Write($Buffer, 0, $ReadCount)
                    $CurrentSize += $ReadCount
                }
                
                $FileStream.Close()
            } else {
                # القراءة المباشرة للملفات الصغيرة
                $Content = [System.IO.File]::ReadAllText($File.FullName, [System.Text.Encoding]::UTF8)
                $CodeStream.Write($Content)
                $CurrentSize += $Content.Length
            }
        } catch { 
            $ErrorMsg = "`n[ERROR READING FILE: $($_.Exception.Message)]`n"
            $CodeStream.Write($ErrorMsg)
            $CurrentSize += $ErrorMsg.Length
        }
    }
}
finally { 
    $CodeStream.Close()
    Write-Progress -Activity "Exporting" -Completed
}

# 9. إنشاء ملف فهرس إذا تم التقسيم
if ($PartFiles.Count -gt 1) {
    $IndexFile = Join-Path $ProjectPath "Project_Codebase_INDEX.txt"
    $IndexStream = [System.IO.StreamWriter]::new($IndexFile, $false, [System.Text.Encoding]::UTF8)
    
    try {
        $IndexStream.WriteLine("=" * 80)
        $IndexStream.WriteLine("PROJECT CODEBASE - SPLIT ARCHIVE INDEX")
        $IndexStream.WriteLine("=" * 80)
        $IndexStream.WriteLine("Total Parts: $($PartFiles.Count)")
        $IndexStream.WriteLine("Total Size: $("{0:N2}" -f ($Stats.TotalSize / 1MB)) MB")
        $IndexStream.WriteLine("=" * 80)
        $IndexStream.WriteLine("")
        
        for ($i = 0; $i -lt $PartFiles.Count; $i++) {
            $PartName = Split-Path $PartFiles[$i] -Leaf
            $FileSize = (Get-Item $PartFiles[$i]).Length
            $IndexStream.WriteLine("Part $($i+1): $PartName ($("{0:N2}" -f ($FileSize/1MB)) MB)")
        }
    }
    finally {
        $IndexStream.Close()
    }
    
    Write-Host "`n📋 Index file created: Project_Codebase_INDEX.txt" -ForegroundColor Magenta
}

# 10. النتائج النهائية
Write-Host "`n" + ("=" * 60) -ForegroundColor Green
Write-Host "✅ EXPORT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Green

Write-Host "`n📊 STATISTICS:" -ForegroundColor Yellow
Write-Host "   📁 Total Files:     $($Stats.Files)" -ForegroundColor White
Write-Host "   📝 Total Lines:     $("{0:N0}" -f $Stats.Lines)" -ForegroundColor White
Write-Host "   🔤 Total Chars:     $("{0:N0}" -f $Stats.Chars)" -ForegroundColor White
Write-Host "   🎯 Est. Tokens:     ~$("{0:N0}" -f $Stats.Tokens)" -ForegroundColor White
Write-Host "   💾 Total Size:      $("{0:N2}" -f ($Stats.TotalSize / 1MB)) MB" -ForegroundColor White
Write-Host "   🐘 Large Files:     $($Stats.LargeFiles) (>500KB)" -ForegroundColor White

Write-Host "`n📦 OUTPUT FILES:" -ForegroundColor Cyan
Write-Host "   📄 Structure:      $MapFileName" -ForegroundColor Green

if ($PartFiles.Count -eq 1) {
    Write-Host "   📦 Code Archive:   $(Split-Path $CodeFilePath -Leaf)" -ForegroundColor Green
    $FinalSize = (Get-Item $CodeFilePath).Length
    Write-Host "   💾 File Size:      $("{0:N2}" -f ($FinalSize / 1MB)) MB" -ForegroundColor Yellow
} else {
    Write-Host "   📦 Code Archives:  $($PartFiles.Count) parts (2MB each)" -ForegroundColor Green
    foreach ($part in $PartFiles) {
        $pName = Split-Path $part -Leaf
        $pSize = (Get-Item $part).Length
        Write-Host "      • $pName ($("{0:N2}" -f ($pSize/1MB)) MB)" -ForegroundColor Gray
    }
    Write-Host "   📋 Index File:     Project_Codebase_INDEX.txt" -ForegroundColor Magenta
}

Write-Host "`n💡 TIPS:" -ForegroundColor Magenta
if ($Stats.LargeFiles -gt 0) {
    Write-Host "   • Large files detected: Used streaming mode to handle them efficiently" -ForegroundColor Gray
}
if ($PartFiles.Count -gt 1) {
    Write-Host "   • Files were split due to size. Import them in order (Part 1 → Part N)" -ForegroundColor Gray
}
Write-Host "   • All files encoded in UTF-8" -ForegroundColor Gray
Write-Host ""