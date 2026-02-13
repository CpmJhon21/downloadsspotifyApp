#!/bin/bash

echo "🔐 SECURE BUILD V2 STARTED..."

# ===============================
# CLEAN OLD BUILD
# ===============================
rm -rf secure_build
mkdir secure_build

# ===============================
# COPY WWW TO SECURE BUILD
# ===============================
cp -r www secure_build/www

echo "✅ Files copied to secure_build"

# ===============================
# OBFUSCATE JS SAFELY
# ===============================
echo "🔄 Obfuscating JavaScript..."

find secure_build/www -type f -name "*.js" ! -name "cordova.js" | while read file; do
    javascript-obfuscator "$file" \
        --output "${file}.obf"

    mv "${file}.obf" "$file"
done

echo "✅ JS Obfuscated"

# ===============================
# MINIFY CSS SAFELY
# ===============================
echo "🔄 Minifying CSS..."

find secure_build/www -type f -name "*.css" | while read file; do
    cleancss "$file" -o "${file}.min"
    mv "${file}.min" "$file"
done

echo "✅ CSS Minified"

# ===============================
# MINIFY HTML SAFELY
# ===============================
echo "🔄 Minifying HTML..."

find secure_build/www -type f -name "*.html" | while read file; do
    html-minifier-terser \
        --collapse-whitespace \
        --remove-comments \
        --minify-css true \
        --minify-js true \
        "$file" -o "${file}.min"

    mv "${file}.min" "$file"
done

echo "✅ HTML Minified"

# ===============================
# TEMPORARILY REPLACE WWW
# ===============================
mv www www_backup_temp
mv secure_build/www www

echo "🚀 Building APK..."
cordova build android

# ===============================
# RESTORE ORIGINAL WWW
# ===============================
rm -rf www
mv www_backup_temp www

echo "🎉 SECURE BUILD COMPLETE!"
