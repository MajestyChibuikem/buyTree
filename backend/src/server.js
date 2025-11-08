require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n💡 API Endpoints:`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Docs:   http://localhost:${PORT}/api`);
  console.log(`\n✨ Ready to accept requests!\n`);
});
