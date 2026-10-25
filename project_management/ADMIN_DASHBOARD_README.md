# Proptee Admin Dashboard — Learning Log

## 1. Why I am building this
Main React seekhte hue Proptee CRM ka admin dashboard bana raha hoon.
Final goal: designated super admin CRM users aur resources manage kar sake.

## 2. Design reference
Pehle teen screenshots dashboard ke reference hain.
Baaki chaar screenshots sidebar ke reference hain.
Primary colour: #3C0C61.

## 3. Step 1 — Initial component
Maine frontend/src/pages/AdminDashboard.tsx file banayi.
Ismein AdminDashboard naam ka React function component likha.
Component abhi heading aur description return karta hai.

## 4. Why this file is separate
Admin dashboard ka code normal user dashboard se separate rahega.
Isse code samajhna aur maintain karna easy hoga.

## 5. What I learned
- Component interface ka ek piece hota hai.
- export default se component doosri file mein import ho sakta hai.
- return component ka JSX result deta hai.
- main primary content ko identify karta hai.
- h1 heading aur p paragraph ke liye hai.
- Opening aur closing tags ka pair sahi hona chahiye.

## 6. Verification
File save karne ke baad editor mein syntax errors check karne hain.
Browser verification abhi pending hai: route connect nahi hua.

## 7. Pending work
- Preview route
- Sidebar and header
- Dashboard styling
- Cards, reports and table
- Backend data integration
- Shashank-only backend authorization

## 8. Next step
App.tsx mein AdminDashboard import karke preview route connect karna.


## Step 2 — Dashboard preview route

### What I changed
App.tsx mein AdminDashboard component import kiya.
Routes ke andar /dashboard-preview path add kiya.

### Why
Browser URL ko mere dashboard component se connect karna tha.

### How it works
React Router current URL check karta hai.
Jab path /dashboard-preview hota hai, AdminDashboard render hota hai.

### What I learned
- import doosri file ka exported component laata hai.
- path browser URL ka route define karta hai.
- element batata hai ki kaunsa component render hoga.
- JSX mein braces expression dene ke liye use hote hain.

### Verification
Pending: browser mein heading aur description check karna hai.

### Limitations
Yeh sirf static UI preview hai.
Is route par admin authorization aur real data integration nahi hai.

### Next step
Dashboard CSS file banakar basic layout aur colour apply karna.

## Troubleshooting — Preview showed Page not found
Source code mein route tha, lekin frontend/dist mein purani build thi.
Port 3001 gateway built files serve karta hai.
npm run build se dist update hota hai.
Development ke liye npm run dev aur port 5173 use kar sakte hain.

Verification: pending until the preview heading appears in the browser.