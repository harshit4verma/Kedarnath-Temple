 = 8080
 = New-Object System.Net.HttpListener
.Prefixes.Add("http://localhost:/")
try {
    .Start()
    Write-Host "Kedarnath Dham Web Server started at http://localhost:/"
    Start-Process "http://localhost:/index.html"
     = 
    while (.IsListening) {
         = .GetContext()
         = .Request
         = .Response
        
         = .Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty()) {  = 'index.html' }
         = Join-Path  

        if (Test-Path  -PathType Leaf) {
             = [System.IO.File]::ReadAllBytes()
             = [System.IO.Path]::GetExtension().ToLower()
             = switch () {
                '.html' { 'text/html; charset=utf-8' }
                '.css'  { 'text/css; charset=utf-8' }
                '.js'   { 'application/javascript; charset=utf-8' }
                '.png'  { 'image/png' }
                '.jpg'  { 'image/jpeg' }
                '.jpeg' { 'image/jpeg' }
                '.svg'  { 'image/svg+xml' }
                default { 'application/octet-stream' }
            }
            .ContentType = 
            .ContentLength64 = .Length
            .OutputStream.Write(, 0, .Length)
        } else {
            .StatusCode = 404
             = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            .OutputStream.Write(, 0, .Length)
        }
        .Close()
    }
} finally {
    .Stop()
}
