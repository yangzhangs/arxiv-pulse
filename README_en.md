# 📚 ArxivPulse

Academic Paper Showcase Platform - Daily automatic sync of latest Software Engineering papers

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)

## 🎯 Introduction

ArxivPulse is an academic paper search and display platform for the RESET group, dedicated to helping team members efficiently track the latest research progress in the Software Engineering field. The platform automatically fetches the latest papers from arXiv daily and uses intelligent keyword matching and tag systems to deliver high-quality research to team members.

## ✨ Features

- 🔄 **Auto Sync** - Daily automatic fetch of latest arxiv papers (Mon-Sat)
- 🏷️ **Tag Filter** - Multi-tag classification and filtering
- 🔍 **Full-text Search** - Search by title, author, abstract
- 📱 **Responsive Design** - Desktop and mobile support
- 📬 **Push Notifications** - Scheduled Feishu notifications
- ✅ **Tag Moderation** - User tag requests with admin approval
- 👤 **Admin Dashboard** - Admin login, tag moderation, statistics
- 🌐 **i18n Support** - Bilingual interface (Chinese/English)

## 🔧 Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite
- **Frontend:** HTML5 + TailwindCSS + Alpine.js
- **Auth:** bcryptjs + Session
- **Deployment:** PM2 + Nginx

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- PM2 (production)
- Nginx (production)

### Installation

1. **Clone repository**
```bash
git clone https://github.com/yangzhangs/arxiv-pulse.git
cd arxiv-pulse
```

2. **Install dependencies**
```bash
npm install
```

3. **Initialize database**
```bash
node src/init-db.js
```

4. **Start development server**
```bash
node src/app.js
```

Visit http://127.0.0.1:3000

### Production Deployment

1. **Install PM2**
```bash
npm install -g pm2
```

2. **Start with PM2**
```bash
pm2 start src/app.js --name arxiv-pulse
pm2 save
pm2 startup
```

3. **Configure Nginx**

```nginx
server {
    listen 80;
    server_name www.reset-group.site reset-group.site;

    location /arxiv-pulse/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

4. **Restart Nginx**
```bash
sudo systemctl restart nginx
```

## 📋 Configuration

### Environment Variables

Create `.env` file:

```env
PORT=3000
NODE_ENV=production
```

### Admin Account

Default admin credentials:
- **Username:** admin
- **Password:** admin123

⚠️ **Important:** Change the default password after first login!

## 🏷️ Tag System

### Default Tags

- Docker
- CI/CD
- DevOps
- Microservices
- Cloud Native
- Serverless
- Hugging Face
- Github Actions
- Agent skills
- Deprecated Packages

### Tag Workflow

1. Users can request new tags on the Tags page
2. Admin reviews requests in Admin Dashboard
3. Approved tags are added to the system
4. Rejected requests are removed

## 🌐 Internationalization

The platform supports bilingual interface (Chinese/English):

- Click language switcher in top-right corner
- Switch between 中文 (Chinese) and EN (English)
- Language preference is saved in browser

## 📊 Project Structure

```
arxiv-pulse/
├── src/
│   ├── app.js              # Main application
│   ├── routes/             # API routes
│   ├── models/             # Database models
│   ├── middleware/         # Express middleware
│   ├── config/             # Configuration (i18n)
│   └── utils/              # Utility scripts
├── views/                  # HTML pages
│   ├── index.html          # Home page
│   ├── tags.html           # Tags page
│   ├── admin.html          # Admin dashboard
│   └── about.html          # About page
├── public/                 # Static files
│   ├── css/                # Stylesheets
│   └── js/                 # JavaScript
├── data/                   # SQLite database
└── README.md               # Documentation
```

## 🔒 Security

- Session-based authentication
- Password hashing with bcryptjs
- Input validation
- SQL injection prevention
- XSS protection headers

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Author

- **yangzhangs** - [GitHub](https://github.com/yangzhangs)

## 🙏 Acknowledgments

- arXiv for providing the paper database
- RESET group for feedback and testing

## 📞 Support

For issues and questions, please open an issue on GitHub or contact the maintainer.
