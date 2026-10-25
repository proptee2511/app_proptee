# Page 1 — Login

## Goal and current status

Property CRM ke liye simple login UI banani thi, jiska API endpoint configurable ho. Page aur API proxy route implemented hain. Actual identity verification service, user sessions, protected dashboard aur database abhi pending hain. Yeh production authentication system nahi hai.

## Files and responsibilities

| File | Explanation |
| --- | --- |
| package.json | Project name, Node minimum version aur npm start command define karta hai. Koi external dependency nahi hai. |
| server.js | Local HTTP server chalata hai, allowed frontend files serve karta hai aur login request actual API ko forward karta hai. |
| public/index.html | Property CRM branding, email/password form, password visibility button aur status area. |
| public/styles.css | Light background, centered white card, blue button, mobile spacing aur keyboard focus styles. |
| public/app.js | Show/hide password, form submission, loading state aur success/error messages handle karta hai. |
| AGENTS.md | Future project work ke liye documentation aur communication instructions. |
| project_management | Changes, explanations, checks aur pending items ka record. |

## Start the application

PowerShell mein:

```powershell
Set-Location D:\CRM
npm start
```

Open http://localhost:3000/login. Root URL / bhi login page deta hai. Server 127.0.0.1 par bind hai, isliye default access is computer se hota hai. Stop karne ke liye server terminal mein Ctrl+C press karein.

Optional port change:

```powershell
$env:PORT = '3001'
npm start
```

## Connect a real login API

Server stop karke AUTH_API_URL set karein, phir restart karein. Neeche URL placeholder hai; actual backend login endpoint use karna hai:

```powershell
$env:AUTH_API_URL = 'https://your-api.example.com/auth/login'
npm start
```

Environment variable current PowerShell session mein apply hota hai. App .env file automatically load nahi karti.

Browser POST /api/auth/login ko JSON bhejta hai:

```json
{
  "email": "you@example.com",
  "password": "your-password"
}
```

Node server isi email/password payload ko AUTH_API_URL par POST karta hai. API URL frontend mein hardcode nahi hai. Browser same-origin local route use karta hai. Agar backend username, different keys, extra headers ya different response format use karta hai, integration accordingly update karni hogi.

## Request flow and behavior

1. Browser /login load karta hai. CSS aur JavaScript same server se aate hain.
2. Required fields aur email format browser validate karta hai. Show button password visibility toggle karta hai.
3. Submit par button disable hota hai aur Signing in status dikhata hai, taaki duplicate submissions avoid hon.
4. Server missing API configuration par 503 message deta hai. Koi demo credential accepted nahi hota.
5. Configured request par server JSON parse karta hai, email/password presence check karta hai aur 16 KiB se bade payload reject karta hai.
6. Upstream API request ka timeout 15 seconds hai. Browser request timeout 20 seconds hai.
7. Upstream 2xx response par abhi sirf credentials verified message dikhaya jata hai. Non-2xx responses friendly failure message dete hain; network failure par 502 aata hai.
8. Request complete hone par submit button enable hota hai. Successful response par password field clear hota hai.

## Security choices and integration limits

Password browser storage mein save nahi hota aur server code credentials log nahi karta. Static routes explicit allowlist se serve hote hain. Cache disabled hai; content-type sniffing aur external script/frame loading restrict ki gayi hai. Upstream redirects reject hote hain.

Upstream tokens, cookies aur response body currently forward/store nahi kiye jaate. Actual API success contract validate karna, secure session design, logout, protected routes, rate limiting aur deployed HTTPS configuration real authentication complete karne ke liye pending hain. Abhi 2xx response ko preliminary success maana jata hai; some APIs 200 ke body mein failure bhejti hain, isliye contract milne par yeh logic update hoga. Dashboard redirect intentionally pending hai kyunki dashboard bana nahi hai.

## Verification scope

Node syntax checks aur local HTTP route checks run hue hain; results CHANGELOG.md mein hain. Browser visual inspection, actual API authentication aur mobile interaction tests abhi execute nahi hue.


## Lavender design update (2026-10-20)
The current UI replaces the original compact blue card with a lavender/white split layout. Primary colour is exactly #C6A5FF (CSS --accent). Left panel introduces the property CRM with a decorative inline SVG house; right panel contains the login form. Small screens use a stacked layout and hide the illustration. Existing API flow and environment configuration above remain valid. The submit button now preserves its arrow after each request. No external assets or new packages are required. API authentication/session work remains pending. Full reference image visual inspection and browser visual QA have not been completed.

## If localhost:3000 does not open
Double-click D:\CRM\start-crm.cmd. Keep the terminal open, wait for the server startup message, then open http://127.0.0.1:3001/login. The launcher selects port 3001 to avoid the observed conflict on 3000. If a startup error appears, its exact text is needed for further diagnosis. This launcher does not change the default npm start port.

> Current implementation supersedes this original static-page setup. See IMPLEMENTATION.md and the root README.md. The new launcher runs the built React frontend and local identity service; AUTH_API_URL is not used by that implementation.
