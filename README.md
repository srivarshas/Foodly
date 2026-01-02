
```markdown
```
# 🍛 Foodly | Campus Logistics Redefined

**Foodly** is a hyper-local, peer-to-peer delivery network designed for college campuses. It connects students who need food with "Delivery Buddies"—students already headed to the same location—optimizing campus movement and saving time.



## 🚀 The Problem
- **Long Canteen Lines:** Students lose 20-30 minutes waiting for food.
- **Delivery Dead-Zones:** Traditional apps often can't enter campus gates or specific hostel blocks.
- **Wasteful Movement:** Hundreds of students walk the same paths daily without any coordination.

## ✨ Key Features

### 🤖 Batching of Orders
Our backend identifies "High Efficiency Corridors." It automatically groups orders coming from the same canteen and heading to the same hostel, creating **Batches**.
- **For Students:** Reduced delivery fees.
- **For Buddies:** Higher earnings per trip by carrying multiple bags at once.

### 🛡️ Secure OTP Handover
To ensure trust in a peer-to-peer network, we implemented a custom verification flow:
1. **Automated Email:** Student receives a 6-digit OTP via in-app section and **Gmail (Nodemailer)**.
2. **Atomic Settlement:** Funds are transferred from Student to Buddy only when the correct OTP is verified.

### 💰 Student Wallet System
A seamless checkout experience using Firebase transactions. No need for cash—earnings and payments are updated in real-time.

### 📊 Buddy Impact Dashboard
Buddies can track their earnings, total deliveries, and "Environmental Impact" (CO2 saved by walking or cycling instead of using motorized delivery).

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, Tailwind CSS (Hosted on Vercel)
- **Backend:** Node.js, Express.js (Hosted on Render)
- **Database:** Google Firebase Firestore
- **Authentication:** Google Cloud IAM / Service Accounts
- **Communication:** Gmail API / Nodemailer
- **AI/ML:** Google Gemini API (Order tracking & Assistant)


## ⚙️ Setup & Installation

1. **Clone the Repo**
```bash
git clone [https://github.com/srivarshas/Foodly.git](https://github.com/srivarshas/Foodly.git)

```


2. **Backend Setup**
```bash
cd server
npm install
# Add your .env variables (FIREBASE_SERVICE_ACCOUNT, GEMINI_API_KEY, etc.)
node server.js

```


3. **Frontend Setup**
```bash
cd client
npm install
npm run dev

```


### Updates made after 31/12/2025:
1. Added a chatbot for recommendeing food items
2. Implemented bactching of order for increasing efficiency
3. Fixed minor bugs

### Note:
This is just a prototype, not the complete model.


## 🌟 Acknowledgments

Built for the **[InnovHack - GDG SASTRA University 2025]**. Special thanks to Google Cloud and Firebase for providing the infrastructure to power campus logistics.

```
