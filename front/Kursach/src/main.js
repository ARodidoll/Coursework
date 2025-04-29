import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initTelegramApp } from './utils/telegramApi' // Импортируем

// Инициализируем Telegram Mini App, если мы внутри Telegram
initTelegramApp();

const app = createApp(App)

app.use(router)

app.mount('#app')