<template>
  <div class="header">
    <div class="currency-box">
      <div class="currency-item">
        <span class="counter-box animated-coin">🪙 {{ catCoinCount }}</span>
      </div>
      <div class="currency-item">
        <span class="counter-box animated-clap">👏 {{ catClapCount }}</span>
      </div>
    </div>
    <button class="menu-btn" @click="toggleMenu">🐾 Меню</button>

    <!-- Меню -->
    <div class="menu-overlay" v-if="menuOpen" @click="toggleMenu">
      <div class="menu-content" @click.stop>
        <button class="close-btn" @click="toggleMenu">×</button>
        <div class="menu-header">
          <img
            :src="require('@/assets/catwhite.png')"
            alt="Logo"
            class="logo"
          />
          <h3>Меню CatClap</h3>
        </div>
        <ul>
          <li @click="navigateTo('main')">
            <span class="menu-icon">💒</span> Home
          </li>
          <li @click="navigateTo('store')">
            <span class="menu-icon">🛍️</span> CatStore
          </li>
          <li @click="navigateTo('friend')">
            <span class="menu-icon">💖</span> friend
          </li>
          <li @click="navigateTo('top')">
            <span class="menu-icon">🏆</span> Leaderboard
          </li>
          <li @click="navigateTo('storepage')">
            <span class="menu-icon">🏦</span> CoinStore
          </li>
          <li @click="navigateTo('about')">
            <span class="menu-icon">🧶</span> About us
          </li>
        </ul>
        <div class="menu-footer">
          <p>Ваш баланс:</p>
          <div class="menu-currency">
            <span class="animated-coin">🪙 {{ catCoinCount }} CatCoins</span>
            <span class="animated-clap">👏 {{ catClapCount }} CatClaps</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useTelegram } from "@/composables/useTelegram"; // Импортируем useTelegram
import { api } from "@/api"; // Импортируем ваш API
import { useCoinsState } from "@/composables/useCoinsState";

const { catCoinCount, catClapCount, loadUserData } = useCoinsState();

// Определяем props для получения данных от родителя
const props = defineProps({
  catClapCount: {
    type: Number,
    default: 0,
  },
  catCoinCount: {
    type: Number,
    default: 0,
  },
});

const router = useRouter();
const { userId, isTelegram } = useTelegram(); // Получаем userId и флаг Telegram

// Используем локальные ref для отображения, но инициализируем из props
const localCatClapCount = ref(props.catClapCount);
const localCatCoinCount = ref(props.catCoinCount);

const menuOpen = ref(false);

// Вычисляемое свойство для отображения имени пользователя (если доступно)
const userName = computed(() => user.value?.first_name || "Меню");

// Функция для форматирования чисел
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num;
};

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

const navigateTo = (route) => {
  router.push({ name: route });
  menuOpen.value = false;
};

// Загрузка данных пользователя при монтировании (если нужно, но лучше передавать через props)
// Эта функция может быть не нужна, если данные всегда приходят через props

// Следим за изменениями props, чтобы обновлять локальные значения
watch(
  () => props.catClapCount,
  (newVal) => {
    localCatClapCount.value = newVal;
  }
);
watch(
  () => props.catCoinCount,
  (newVal) => {
    localCatCoinCount.value = newVal;
  }
);

onMounted(() => {
  loadUserData();
});
</script>

<!-- Шаблон <template> остается без изменений, но используйте localCatClapCount и localCatCoinCount -->
<!-- Также можно добавить v-if="!isTelegram" для скрытия хедера в Telegram -->

<style scoped>
/* Общие стили шапки */
.logo {
  width: 100px;
  height: 100px;
  object-fit: contain; /* Сохраняем пропорции картинки */
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 25px;
  background: white;
  box-shadow: 0 2px 15px rgba(255, 105, 180, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid #ffd6e7;
}

.currency-box {
  display: flex;
  gap: 20px;
}

.currency-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff5f9;
  padding: 5px 15px;
  border-radius: 30px;
  border: 1px solid #ffb6c1;
  cursor: pointer;
}

.counter-box {
  font-weight: bold;
  color: #ff69b4;
  font-size: 16px;
}

/* Анимации для валюты */
.animated-coin {
  animation: coinGlow 2s ease-in-out infinite;
}

.animated-clap {
  animation: clapBounce 1.5s ease-in-out infinite;
}

@keyframes coinGlow {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes clapBounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.menu-btn {
  font-size: 16px;
  background: linear-gradient(to right, #ff69b4, #ff8fab);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 8px rgba(255, 105, 180, 0.2);
  transition: all 0.3s;
}

.menu-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(255, 20, 147, 0.3);
}

/* Стили меню */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.3s ease;
}

.menu-content {
  width: 300px;
  height: 100%;
  background: white;
  padding: 30px;
  box-shadow: -2px 0 15px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow-y: auto;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 28px;
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #ff69b4;
}

.menu-header {
  text-align: center;
  margin-bottom: 30px;
}

.menu-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 15px;
}

.menu-content h3 {
  margin-bottom: 25px;
  color: #ff69b4;
  font-size: 1.5rem;
}

.menu-content ul {
  list-style: none;
  padding: 0;
}

.menu-content li {
  padding: 15px 0;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
}

.menu-content li:hover {
  color: #ff69b4;
  padding-left: 10px;
}

.menu-icon {
  font-size: 1.3rem;
}

.menu-footer {
  margin-top: 40px;
  padding-top: 20px;
  text-align: center;
}

.menu-currency {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
  font-size: 1rem;
  color: #ff69b4;
}

/* Анимации */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Десктопные анимации */
@media (min-width: 380px) {
  .animated-coin {
    animation: coinGlowDesktop 2s ease-in-out infinite;
  }

  .animated-clap {
    animation: clapBounceDesktop 1.5s ease-in-out infinite;
  }

  @keyframes coinGlowDesktop {
    0%,
    100% {
      transform: scale(1);
      filter: drop-shadow(0 0 5px gold);
    }
    50% {
      transform: scale(1.05);
      filter: drop-shadow(0 0 10px gold);
    }
  }

  @keyframes clapBounceDesktop {
    0%,
    100% {
      transform: translateY(0);
      filter: drop-shadow(0 0 5px #ff69b4);
    }
    50% {
      transform: translateY(-3px);
      filter: drop-shadow(0 0 8px #ff69b4);
    }
  }
}

@media (max-width: 480px) {
  .menu-content {
    width: 100%;
  }
}
</style>
