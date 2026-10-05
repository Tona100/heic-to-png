HEIC → PNG Converter v3

This version includes:
- Browser-local HEIC → PNG conversion
- Individual "Download PNG" buttons for every converted file
- "Download All as ZIP" for batch downloads
- No uploads or signup

Run locally:
python3 -m http.server 8000

Then open:
http://localhost:8000


V4 update:
- Added copy-and-paste support for HEIC/HEIF files.
- On Mac, copy HEIC/HEIF files in Finder and press Command+V while the converter page is active.
- On Windows/Linux, use Control+V.
- Pasted files are added to the existing file list instead of replacing it.
- Duplicate pasted files are ignored.


V5 fix:
- Restored the tested heic-to 1.6.5 decoder call used by V3.
- V4 had loaded heic-to but accidentally called the old heic2any function.
- Copy/paste support is preserved.
