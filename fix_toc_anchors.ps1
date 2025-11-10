# 修复所有HTML文件中的TOC链接问题
Get-ChildItem -Path . -Recurse -Include "*.html" | ForEach-Object {
    $file = $_.FullName
    Write-Host "处理文件: $file" -ForegroundColor Green
    
    # 读取文件内容
    $content = Get-Content -Path $file -Raw -Encoding UTF8
    
    # 修复 generateTableOfContents 函数中的ID处理逻辑
    $oldPattern = 'headings\.forEach\(\(heading, index\) => \{\s*// 为标题添加ID（如果没有的话）\s*if \(!heading\.id\) \{\s*heading\.id = ''heading-'' \+ index;\s*\}\s*\}'
    $newCode = 'headings.forEach((heading, index) => {
            // 强制为每个标题设置标准化的ID（始终重写现有ID）
            const normalizedId = ''heading-'' + index;
            heading.id = normalizedId;'
    
    # 替换内容
    $modified = $false
    if ($content -match $oldPattern) {
        $content = $content -replace $oldPattern, $newCode
        $modified = $true
    }
    
    # 如果有修改，写回文件
    if ($modified) {
        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Host "  文件已修复" -ForegroundColor Yellow
    } else {
        Write-Host "  无需修改" -ForegroundColor Gray
    }
}

Write-Host "修复完成！" -ForegroundColor Cyan