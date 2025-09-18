# 🌐 Hookrest API

![Hookrest API](https://img.shields.io/badge/API-Hookrest-blueviolet?style=for-the-badge&logo=node.js)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)

**Integrated API solution for your modern application development needs. Fast, secure, and reliable access.**

## ✨ Features

- 🚀 **High Performance**: Optimized for speed and efficiency
- 🔒 **Secure**: Built with security best practices
- 📊 **Comprehensive**: Multiple endpoints for various needs
- 🔌 **Extensible**: Plugin-based architecture for customization
- 📱 **Modern**: RESTful design with JSON responses
- 🔍 **Detailed Analytics**: Built-in statistics and monitoring

## 🏗️ Project Structure

```
hookrest-api/
├── 📁 plugins/          # Custom plugins directory
├── 📁 categories/       # API categories
│   ├── 📁 User/        # User-related endpoints
│   ├── 📁 Products/    # Product-related endpoints
│   └── 📁 Analytics/   # Analytics endpoints
├── ⚙️ settings.js       # Configuration settings
├── 🚀 server.js        # Main server file
└── 📄 package.json     # Dependencies and scripts
```

## ⚙️ Configuration

The API is configured through `settings.js`:

```javascript
module.exports = {
  name: {
    main: "Hookrest API",
    copyright: "Hookrest Team"
  },
  description: "Integrated API solution for your modern application development needs. Fast, secure, and reliable access.",
  icon: "/image/icon.png",
  author: "Hookrest-Team",
  info_url: "https://whatsapp.com/channel/0029Vb5CxIfAjPXInV7XWz38",
  links: [{
    name: "Channel WhatsApp Inf.",
    url: "https://whatsapp.com/channel/0029Vb5CxIfAjPXInV7XWz38"
  }]
};
```

## 🔌 Plugin System

Hookrest API features a powerful plugin system. Here's an example plugin that counts API endpoints:

```javascript
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "Total Api",
  desc: "Menampilkan total semua fitur di semua kategori",
  category: "User",
  async run(req, res) {
    try {
      const baseDir = path.join(__dirname, "..");
      const categories = fs.readdirSync(baseDir).filter(file => {
        const fullPath = path.join(baseDir, file);
        return fs.statSync(fullPath).isDirectory();
      });
      
      let total = 0;
      const detail = {};
      
      for (const category of categories) {
        const categoryDir = path.join(baseDir, category);
        const files = fs.readdirSync(categoryDir).filter(f => f.endsWith(".js"));
        total += files.length;
        detail[category] = files.length;
      }
      
      res.json({
        status: true,
        total: total,
        perKategori: detail
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: err.message
      });
    }
  }
};
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hookrest-team/hookrest-api.git
cd hookrest-api
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
API_KEY=your_secret_key_here
```

## 📡 API Endpoints

### Base URL
```
https://api.hookrest.com/v1
```

### Example Endpoints

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/api/total` | GET | Get total API count | None |
| `/api/users` | GET | Get user list | `limit`, `offset` |
| `/api/users/:id` | GET | Get user by ID | `id` |

### Example Request

```bash
curl -X GET "https://api.hookrest.com/v1/api/total" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Example Response

```json
{
  "status": true,
  "total": 42,
  "perKategori": {
    "User": 15,
    "Products": 20,
    "Analytics": 7
  }
}
```

## 🛠️ Development

### Adding New Endpoints

1. Create a new file in the appropriate category directory
2. Follow the plugin structure:
```javascript
module.exports = {
  name: "Endpoint Name",
  desc: "Description of what the endpoint does",
  category: "CategoryName",
  async run(req, res) {
    // Your implementation here
  }
};
```

### Custom Plugins

You can create custom plugins in the `plugins/` directory. These will be automatically loaded by the system.

## 🔒 Security

Hookrest API includes several security features:
- API key authentication
- Rate limiting
- CORS configuration
- Input validation
- SQL injection protection

## 📊 Monitoring

The API includes built-in monitoring capabilities:
- Request logging
- Performance metrics
- Error tracking
- Usage statistics

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and information:
- Join our [WhatsApp Channel](https://whatsapp.com/channel/0029Vb5CxIfAjPXInV7XWz38)
- Create an issue in the GitHub repository

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Hookrest Team
- All contributors and supporters

---

**Hookrest API** · Built with ❤️ by the Hookrest Team · [WhatsApp Channel](https://whatsapp.com/channel/0029Vb5CxIfAjPXInV7XWz38)
