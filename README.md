# MONKEY — 3D Profile

A rebranded personal profile based on the structure and interaction style of [Sye0001/3d-profile](https://github.com/Sye0001/3d-profile), with Monkey branding and live Discord presence through Lanyard.

The owner has stated that they have permission from the original project owner to reuse the project. The upstream repository currently has no license file, so retain this attribution and the permission record when redistributing.

## Features retained / adapted
- Click-to-enter intro overlay
- 3D mouse-tilting profile card with layered depth
- Banner and avatar profile layout
- Discord profile name, avatar, banner, public badges and live online status via Lanyard
- About Me and Connections sections
- Live Discord activity display
- Spotify listening card when Lanyard reports Spotify activity
- Three presentation styles inspired by the upstream `card`, `framed`, and `risky` routes
- Responsive desktop/mobile layout

## Removed as requested
- No background videos
- No YouTube embeds
- No music player or autoplay audio
- No IP address lookup

## Configure
Edit `config.js`:
- `discordId` is already set to `1215522544564703323`
- `displayName` is `Monkey`
- Change `about`
- Update `githubUrl`
- Edit the `connections` array to add/remove social links

## GitHub Pages
This is a static site; no Node build is needed.
1. Extract the ZIP.
2. Upload the contents of this folder to the root of your GitHub repository.
3. Go to **Settings → Pages**.
4. Select **Deploy from a branch**, branch `main`, folder `/(root)`.
5. Save.

## Lanyard
Your Discord account must be sharing presence with Lanyard. The website connects to `wss://api.lanyard.rest/socket`. If Lanyard is unavailable, the static profile still loads; only live presence is unavailable.

## Upstream project
The profile card structure and 3D interaction are adapted from:
https://github.com/Sye0001/3d-profile
Live reference:
https://3d-profile-beige.vercel.app

This package is a static GitHub Pages adaptation, not a byte-for-byte copy of the original Next.js repository. It preserves and adapts the visible profile experience and its three card presentation variants.
