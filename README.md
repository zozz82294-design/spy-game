# 🕵️ Spy Game - لعبة الجاسوس

لعبة جاسوس أونلاين متعددة اللاعبين!

## 🚀 رفع اللعبة على Render (مجاني!)

### الخطوة 1: ارفع الكود على GitHub
1. اعمل repository جديد على [GitHub](https://github.com/new)
2. افتح Terminal في مجلد المشروع واكتب:
```bash
git init
git add .
git commit -m "Spy Game"
git remote add origin https://github.com/USERNAME/spy-game.git
git push -u origin main
```

### الخطوة 2: ارفع على Render
1. ادخل على [Render.com](https://render.com) وسجل (مجاني)
2. اضغط **New +** → **Web Service**
3. اربط حساب GitHub واختار الـ repository
4. الإعدادات:
   - **Name**: spy-game
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
5. اضغط **Create Web Service**

### الخطوة 3: شارك الرابط! 🎉
بعد ما السيرفر يشتغل، هتلاقي رابط زي:
```
https://spy-game-xxxx.onrender.com
```

**ابعت الرابط ده لأصحابك وهييدخلوا اللعبة مباشرة من أي مكان في العالم!** 🌍

## 💻 تشغيل محلي
```bash
npm install
npm start
```
افتح `http://localhost:3000`

## 🔗 روابط الغرف
لما تعمل غرفة، الرابط هيكون:
```
https://spy-game-xxxx.onrender.com/room/ROOM_ID
```
أي حد يفتح الرابط ده يدخل اللعبة مباشرة!
