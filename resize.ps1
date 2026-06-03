Add-Type -AssemblyName System.Drawing
$imgPath = "c:\Users\favaz\Web Branding\public\favicon.png"
$img = [System.Drawing.Image]::FromFile($imgPath)

function Resize-Image($source, $target, $size) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($source, 0, 0, $size, $size)
    $bmp.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Resize-Image $img "c:\Users\favaz\Web Branding\public\favicon-32x32.png" 32
Resize-Image $img "c:\Users\favaz\Web Branding\public\favicon-16x16.png" 16
Resize-Image $img "c:\Users\favaz\Web Branding\public\apple-touch-icon.png" 180

$img.Dispose()
