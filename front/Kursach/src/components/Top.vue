<template>
  <div class="app-container">
    <!-- Подключаем хедер -->
    <AppHeader :catClapCount="catClapCount" :catCoinCount="catCoinCount" />

    <!-- Основной контент -->
    <div class="top-container">
      <div class="confetti-container">
        <div
          v-for="i in 20"
          :key="i"
          class="confetti"
          :style="confettiStyle(i)"
        ></div>
      </div>

      <div class="top-header">
        <div class="title-wrapper">
          <h1 class="top-title">🏆 Leaderboard</h1>
          <div class="title-underline"></div>
        </div>
       

        <div class="filter-box">
          <button
            class="filter-btn"
            :class="{ active: activeFilter === 'claps' }"
            @click="activeFilter = 'claps'"
          >
            👏 Claps
          </button>
          <button
            class="filter-btn"
            :class="{ active: activeFilter === 'coins' }"
            @click="activeFilter = 'coins'"
          >
            🪙 Coins
          </button>
        </div>
      </div>

      <div class="top-content">
        <!-- Топ 3 игрока -->
        <div class="top-players">
          <!-- Второе место -->
          <div v-if="topPlayers[1]" class="player-card second-place">
            <div class="medal silver">2</div>
            <div class="ribbon silver-ribbon"></div>
            <img
              :src="getPlayerAvatar(topPlayers[1])"
              alt="Avatar"
              class="player-avatar"
              :class="{ 'current-user': isCurrentUser(topPlayers[1]) }"
            />
            <h3 class="player-name">{{ topPlayers[1].name }}</h3>
            <div class="player-score">
              <span v-if="activeFilter === 'claps'"
                >👏 {{ formatNumber(topPlayers[1].claps) }}</span
              >
              <span v-else>🪙 {{ formatNumber(topPlayers[1].coins) }}</span>
            </div>
          </div>

          <!-- Первое место -->
          <div v-if="topPlayers[0]" class="player-card first-place">
            <div class="medal gold">1</div>
            <div class="ribbon gold-ribbon"></div>
            <img
              :src="getPlayerAvatar(topPlayers[0])"
              alt="Avatar"
              class="player-avatar"
              :class="{ 'current-user': isCurrentUser(topPlayers[0]) }"
            />
            <div class="crown">👑</div>
            <div class="sparkle-container">
              <span class="sparkle" v-for="n in 5" :key="n">✨</span>
            </div>
            <h3 class="player-name">{{ topPlayers[0].name }}</h3>
            <div class="player-score">
              <span v-if="activeFilter === 'claps'"
                >👏 {{ formatNumber(topPlayers[0].claps) }}</span
              >
              <span v-else>🪙 {{ formatNumber(topPlayers[0].coins) }}</span>
            </div>
          </div>

          <!-- Третье место -->
          <div v-if="topPlayers[2]" class="player-card third-place">
            <div class="medal bronze">3</div>
            <div class="ribbon bronze-ribbon"></div>
            <img
              :src="getPlayerAvatar(topPlayers[2])"
              alt="Avatar"
              class="player-avatar"
              :class="{ 'current-user': isCurrentUser(topPlayers[2]) }"
            />
            <h3 class="player-name">{{ topPlayers[2].name }}</h3>
            <div class="player-score">
              <span v-if="activeFilter === 'claps'"
                >👏 {{ formatNumber(topPlayers[2].claps) }}</span
              >
              <span v-else>🪙 {{ formatNumber(topPlayers[2].coins) }}</span>
            </div>
          </div>
        </div>

        <!-- Остальные игроки -->
        <div class="players-list">
          <div
            v-for="(player, index) in remainingPlayers"
            :key="player.id"
            class="list-item"
            :class="{ 'current-user-item': isCurrentUser(player) }"
          >
            <div class="list-rank">{{ index + 4 }}</div>
            <img
              :src="getPlayerAvatar(player)"
              alt="Avatar"
              class="list-avatar"
              :class="{ 'current-user': isCurrentUser(player) }"
            />
            <div class="list-name">{{ player.name }}</div>
            <div class="list-score">
              <span v-if="activeFilter === 'claps'"
                >👏 {{ formatNumber(player.claps) }}</span
              >
              <span v-else>🪙 {{ formatNumber(player.coins) }}</span>
            </div>
          </div>
        </div>

        <!-- Блок интересных фактов -->
        <div class="fun-fact-container">
          <div class="fun-fact">
            <div class="fun-fact-icon-container">
              <div class="fun-fact-icon">💡</div>
            </div>
            <div class="fun-fact-content">
              <h3>Знаете ли вы?</h3>
              <p>{{ currentFact }}</p>
            </div>
            <button class="fun-fact-next" @click="nextFact">Еще факт</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import AppHeader from "./AppHeader.vue";
import { useTelegram } from "@/composables/useTelegram";
import { api } from "@/api";

// Используем composable для доступа к данным Telegram
const { userId, user, isTelegram } = useTelegram();

// Добавьте этот метод в script setup
const nextFact = () => {
  const currentIndex = funFacts.indexOf(currentFact.value);
  const nextIndex = (currentIndex + 1) % funFacts.length;
  currentFact.value = funFacts[nextIndex];
}; 
// Счетчики валюты для хедера
const catClapCount = ref(0);
const catCoinCount = ref(0);

// Добавляем состояние для хранения выбранного кота текущего пользователя
const selectedCat = ref(null);

// Добавляем состояние для хранения котов всех пользователей
const userCats = ref({}); // Объект вида { userId: catData }

// Состояние фильтра и данных игроков
const activeFilter = ref("claps"); // 'claps' или 'coins' по умолчанию
const players = ref([]); // Начинаем с пустого массива, данные загрузятся в onMounted

// Функция загрузки выбранного кота текущего пользователя
const loadSelectedCat = () => {
  try {
    const savedSelectedCat = localStorage.getItem("selectedCat");
    if (savedSelectedCat) {
      selectedCat.value = JSON.parse(savedSelectedCat);
      console.log("Загружен выбранный кот для аватара:", selectedCat.value);

      // Добавляем своего кота в общий объект
      if (userId.value && selectedCat.value) {
        userCats.value[userId.value] = selectedCat.value;
      }
    }
  } catch (error) {
    console.error("Ошибка загрузки выбранного кота:", error);
  }
};

// Загрузка котов всех пользователей
const loadAllUserCats = async () => {
  try {
    // Запрос на получение котов всех пользователей
    const response = await api.getAllUserCats();
    if (response && Array.isArray(response)) {
      // Преобразуем массив в объект для быстрого доступа по ID
      const catsMap = {};

      response.forEach((item) => {
        // Проверяем валидность записи
        if (typeof item !== "object" || !item.user_id || !item.selected_cat) {
          console.warn(
            "Пропускаем некорректную запись о коте пользователя:",
            item
          );
          return;
        }

        // Нормализуем ID пользователя
        let normalizedUserId = item.user_id;
        if (typeof normalizedUserId === "object") {
          if (normalizedUserId.$oid) normalizedUserId = normalizedUserId.$oid;
          else if (normalizedUserId._id)
            normalizedUserId = normalizedUserId._id;
        }
        normalizedUserId = String(normalizedUserId);

        // Проверка на валидный ID (не "selected-cats")
        if (normalizedUserId === "selected-cats") {
          console.warn(
            "Пропускаем некорректный ID пользователя:",
            normalizedUserId
          );
          return;
        }

        catsMap[normalizedUserId] = {
          id: item.selected_cat.cat_id,
          title: item.selected_cat.name,
          images: item.selected_cat.images || {
            normal:
              item.selected_cat.images?.normal ||
              "/cat_avatars/normal/default.jpg",
            happy: "/cat_avatars/happy/default.jpg",
            sad: "/cat_avatars/sad/default.jpg",
          },
          color: item.selected_cat.color,
        };
      });

      // Обновляем состояние
      userCats.value = { ...userCats.value, ...catsMap };
      console.log(
        "Загружены коты всех пользователей:",
        Object.keys(userCats.value).length
      );
    }
  } catch (error) {
    console.error("Ошибка при загрузке котов пользователей:", error);
  }
};

// Измененная функция для получения аватарки игрока - теперь показывает кота для всех
const getPlayerAvatar = (player) => {
  if (!player || !player.id) return "/avatars/default.png";

  // Нормализуем ID игрока
  let playerId = String(player.id);

  // Если у игрока есть кот в нашем кэше
  if (playerId && userCats.value[playerId] && userCats.value[playerId].images) {
    const catImages = userCats.value[playerId].images;
    // Возвращаем изображение кота в нормальном состоянии
    return catImages.normal || catImages.happy || player.avatar;
  }
  // Иначе возвращаем обычный аватар
  return player.avatar;
};

// Добавляем функцию для проверки текущего пользователя
const isCurrentUser = (player) => {
  return player.id === userId.value;
};

// Фильтрация и сортировка игроков
const filteredPlayers = computed(() => {
  // Создаем копию массива для сортировки, чтобы не мутировать исходный ref
  let list = [...players.value];

  // Фильтруем ошибочных пользователей (с ID "selected-cats")
  list = list.filter(
    (player) =>
      player.id !== "selected-cats" &&
      typeof player.id !== "undefined" &&
      player.id !== null
  );

  // Сортируем по убыванию в зависимости от активного фильтра
  return list.sort((a, b) => {
    if (activeFilter.value === "claps") {
      // Сортировка по хлопкам - используем правильное поле
      return (b.claps || 0) - (a.claps || 0);
    } else {
      // Сортировка по монетам - используем правильное поле
      return (b.coins || 0) - (a.coins || 0);
    }
  });
});

// Топ-3 игрока (переименовано для соответствия шаблону)
const topPlayers = computed(() => filteredPlayers.value.slice(0, 3));

// Остальные игроки (переименовано для соответствия шаблону)
const remainingPlayers = computed(() => filteredPlayers.value.slice(3));

// Загрузка данных при монтировании компонента
onMounted(async () => {
  console.log("Current User ID:", userId.value);
  console.log("Telegram User Data:", user.value);
  console.log("Is Telegram App:", isTelegram.value);

  // Загружаем выбранного кота
  loadSelectedCat();

  // Загружаем котов всех пользователей
  await loadAllUserCats();

  try {
    // 1. Загрузка данных текущего пользователя (монеты, хлопки)
    if (userId.value) {
      const userData = await api.getUser(userId.value);
      if (userData) {
        catCoinCount.value = userData.coins_count || 0;
        catClapCount.value = userData.claps_count || 0;
      } else {
        console.warn(`Top.vue: Пользователь с ID ${userId.value} не найден.`);
        catCoinCount.value = 0;
        catClapCount.value = 0;
      }
    } else {
      // Обработка случая без userId (например, веб-версия)
      catCoinCount.value = 0;
      catClapCount.value = 0;
    }

    // 2. Загрузка списка лидеров
    const leaderboardData = await api.getTopUsers();

    // Валидация и фильтрация некорректных данных
    const validPlayers = (leaderboardData || [])
      .filter((p) => {
        // Фильтруем записи с некорректными ID
        if (!p.user_id || p.user_id === "selected-cats") {
          console.warn("Обнаружен некорректный ID пользователя:", p.user_id);
          return false;
        }
        return true;
      })
      .map((p) => ({
        id: p.user_id, // или p.id
        name: p.username || "Игрок", // или p.name
        avatar: p.avatar_url || "/avatars/default.png", // URL аватара или дефолтный
        claps: p.claps_count || 0,
        coins: p.coins_count || 0,
      }));

    console.log(`Загружено ${validPlayers.length} игроков для таблицы лидеров`);
    players.value = validPlayers;
  } catch (error) {
    console.error("Ошибка загрузки данных в Top.vue:", error);
    players.value = []; // Очистить список при ошибке

    // Fallback на localStorage, если необходимо
    const savedData = localStorage.getItem(
      `catAppData_${userId.value || "web_fallback"}`
    );
    if (savedData) {
      const parsed = JSON.parse(savedData);
      catCoinCount.value = parsed.catCoinCount || 0;
      catClapCount.value = parsed.catClapCount || 0;
    } else {
      catCoinCount.value = 0;
      catClapCount.value = 0;
    }
  }

  // 3. Установка случайного факта
  currentFact.value = funFacts[Math.floor(Math.random() * funFacts.length)];
});

// Массив интересных фактов
const funFacts = [
  "Средний кот проводит 2/3 своей жизни во сне. Это почти 16 часов в день!",
  "Кошки могут издавать около 100 различных звуков. Собаки - только около 10.",
  "Самая старая кошка в мире дожила до 38 лет!",
  "У кошек есть уникальный 'отпечаток носа', похожий на отпечаток пальца человека.",
  "Мурлыканье кошки не всегда означает счастье; они также мурлычут, когда болеют или напуганы.",
];
const currentFact = ref(funFacts[0]); // Начинаем с первого факта

// Функция для генерации стилей конфетти
const confettiStyle = (index) => {
  const colors = ["#ff69b4", "#ffb6c1", "#ffd700", "#add8e6", "#90ee90"];
  const size = Math.random() * 8 + 4;
  const left = Math.random() * 100;
  const delay = Math.random() * 10;
  const duration = Math.random() * 5 + 5;
  const color = colors[Math.floor(Math.random() * colors.length)];

  return {
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: color,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  };
};

// Функция для форматирования чисел
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num || 0; // Возвращаем 0, если num не определено
};
</script>

<style scoped>
/* Общие стили */
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #fff0f5 0%, #ffe6f0 100%);
  font-family: "Comic Neue", "Poppins", cursive, sans-serif;
}

.top-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* Конфетти */
.confetti-container {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.confetti {
  position: absolute;
  top: -10px;
  border-radius: 50%;
  opacity: 0.7;
  animation: confettiFall 10s linear infinite;
}

@keyframes confettiFall {
  0% {
    transform: translateY(-10px) rotate(0deg);
    opacity: 0.7;
  }
  100% {
    transform: translateY(calc(100vh)) rotate(360deg);
    opacity: 0;
  }
}

/* Улучшенный заголовок */
.top-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 2;
}

.title-wrapper {
  position: relative;
  margin-bottom: 15px;
}

.top-title {
  font-size: 3.2rem;
  background: linear-gradient(135deg, #ff36b3, #ff74bf, #ff36b3);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% auto;
  text-align: center;
  margin-bottom: 5px;
  font-weight: 800;
  text-shadow: 0 3px 6px rgba(255, 105, 180, 0.2);
  animation: shimmer 3s ease-in-out infinite;
  letter-spacing: 1px;
}

@keyframes shimmer {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.title-underline {
  height: 5px;
  width: 60%;
  margin: 0 auto;
  background: linear-gradient(to right, transparent, #ff69b4, transparent);
  border-radius: 10px;
  animation: pulseWidth 3s ease-in-out infinite;
}

@keyframes pulseWidth {
  0%, 100% {
    width: 60%;
    opacity: 0.7;
  }
  50% {
    width: 80%;
    opacity: 1;
  }
}

.top-subtitle {
  color: #888;
  font-size: 1.1rem;
  margin-bottom: 20px;
  font-style: italic;
}

.filter-box {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.filter-btn {
  padding: 12px 25px;
  border-radius: 30px;
  border: 2px solid #ffb6c1;
  background: white;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1.1rem;
  font-weight: 600;
}

.filter-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 10px rgba(255, 105, 180, 0.25);
}

.filter-btn.active {
  background: linear-gradient(to right, #ff69b4, #ff8fab);
  color: white;
  border-color: transparent;
  box-shadow: 0 6px 12px rgba(255, 105, 180, 0.4);
}

.top-content {
  position: relative;
  z-index: 2;
}

.top-players {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  margin-bottom: 50px;
  height: 350px;
  padding: 0 40px; /* Добавляем отступы для лент по сторонам */
}

.player-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: visible; /* Изменено с overflow: hidden для видимости ленты */
}

.player-card:hover {
  transform: translateY(-15px);
  box-shadow: 0 20px 40px rgba(255, 105, 180, 0.2);
}

.first-place {
  height: 350px;
  width: 250px;
  z-index: 3;
  border: 3px solid gold;
  box-shadow: 0 15px 40px rgba(255, 215, 0, 0.4);
  margin: 0 -15px;
  background: linear-gradient(to bottom, #fffaf0, white);
}

.second-place,
.third-place {
  height: 300px;
  width: 200px;
  z-index: 2;
}

.second-place {
  border: 3px solid silver;
  background: linear-gradient(to bottom, #f8f8f8, white);
}

.third-place {
  border: 3px solid #cd7f32;
  background: linear-gradient(to bottom, #fff8f0, white);
}

/* Ленты для победителей - исправлены для адаптивности */
.ribbon {
  position: absolute;
  top: 25px;
  right: -30px;
  width: 100px;
  height: 30px;
  transform: rotate(45deg);
  z-index: 5;
}



/* Медали - исправлены для адаптивности */
.medal {
  position: absolute;
  top: -20px;
  left: calc(50% - 20px);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 1.2rem;
  z-index: 10;
}

.gold {
  background: linear-gradient(135deg, #ffd700, #ffcc00);
  box-shadow: 0 4px 10px rgba(255, 215, 0, 0.5);
}

.silver {
  background: linear-gradient(135deg, #c0c0c0, #e0e0e0);
  box-shadow: 0 4px 10px rgba(192, 192, 192, 0.5);
}

.bronze {
  background: linear-gradient(135deg, #cd7f32, #dda15e);
  box-shadow: 0 4px 10px rgba(205, 127, 50, 0.5);
}

.crown {
  position: absolute;
  top: -40px; /* Повышена позиция для видимости */
  font-size: 2.5rem;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  animation: float 3s ease-in-out infinite;
  z-index: 10;
}

/* Звездочки вокруг победителя */
.sparkle-container {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  font-size: 1.2rem;
  animation: twinkle 3s ease-in-out infinite;
}

.sparkle:nth-child(1) {
  top: 20%;
  left: 10%;
  animation-delay: 0.5s;
}

.sparkle:nth-child(2) {
  top: 15%;
  right: 10%;
  animation-delay: 1s;
}

.sparkle:nth-child(3) {
  bottom: 30%;
  left: 5%;
  animation-delay: 1.5s;
}

.sparkle:nth-child(4) {
  bottom: 30%;
  right: 5%;
  animation-delay: 2s;
}

.sparkle:nth-child(5) {
  top: 50%;
  right: 8%;
  animation-delay: 2.5s;
}

@keyframes twinkle {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.8;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(-5deg);
  }
  50% {
    transform: translateY(-12px) rotate(5deg);
  }
}

.player-avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  transition: transform 0.4s ease;
}

.player-card:hover .player-avatar {
  transform: scale(1.05);
}

.first-place .player-avatar {
  width: 130px;
  height: 130px;
  border: 5px solid gold;
}

.second-place .player-avatar {
  border: 4px solid silver;
}

.third-place .player-avatar {
  border: 4px solid #cd7f32;
}

.player-name {
  margin: 20px 0 8px;
  font-size: 1.3rem;
  text-align: center;
  color: #333;
  font-weight: 600;
}

.first-place .player-name {
  font-size: 1.6rem;
  font-weight: 700;
  background: linear-gradient(to right, #ff69b4, #ff8fab);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.player-score {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ff69b4;
  padding: 5px 15px;
  border-radius: 20px;
  background: #fff5f9;
  border: 1px dashed #ffb6c1;
}

.first-place .player-score {
  font-size: 1.4rem;
  background: #fffaf0;
  border: 1px dashed gold;
}

/* Список остальных игроков */
.players-list {
  background: white;
  border-radius: 25px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid #ffd6e7;
  margin-bottom: 40px;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 15px 25px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s;
}

.list-item:hover {
  background: #fff5f9;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.1);
  z-index: 5;
  position: relative;
}

.list-rank {
  width: 35px;
  height: 35px;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #666;
  margin-right: 20px;
  transition: all 0.3s;
}

.list-item:hover .list-rank {
  background: #ffb6c1;
  color: white;
  transform: scale(1.1);
}

.list-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 20px;
  border: 3px solid #fff5f9;
  transition: all 0.3s;
}

.list-item:hover .list-avatar {
  border-color: #ffb6c1;
  transform: scale(1.1);
}

.list-name {
  flex-grow: 1;
  font-size: 1.1rem;
  color: #333;
  font-weight: 500;
}

.list-score {
  font-weight: bold;
  color: #ff69b4;
  padding: 5px 10px;
  background: #fff5f9;
  border-radius: 15px;
  transition: all 0.3s;
}

.list-item:hover .list-score {
  background: #ffb6c1;
  color: white;
}

/* Обновленный блок с интересным фактом */
.fun-fact-container {
  margin: 40px 0 20px;
}

.fun-fact {
  background: linear-gradient(145deg, #ffffff 0%, #fff8fb 100%);
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(255, 105, 180, 0.15);
  padding: 30px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  border-left: 6px solid #ff69b4;
}

.fun-fact:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(255, 105, 180, 0.25);
}

.fun-fact-icon-container {
  position: relative;
  width: 70px;
  height: 70px;
  background: #fff5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  flex-shrink: 0;
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.2);
}

.fun-fact-icon {
  font-size: 2.5rem;
  animation: pulseBrightness 2s infinite alternate;
}

@keyframes pulseBrightness {
  0%, 100% {
    filter: brightness(1);
    transform: scale(1);
  }
  50% {
    filter: brightness(1.2);
    transform: scale(1.1);
  }
}

.fun-fact-content {
  flex: 1;
}

.fun-fact-content h3 {
  color: #ff69b4;
  margin: 0 0 12px 0;
  font-size: 1.5rem;
  font-weight: 700;
  position: relative;
  display: inline-block;
}

.fun-fact-content h3::after {
  content: "";
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 40px;
  height: 3px;
  background: #ffb6c1;
  border-radius: 3px;
}

.fun-fact-content p {
  margin: 0;
  color: #555;
  font-size: 1.1rem;
  line-height: 1.6;
  font-style: italic;
}

.fun-fact-next {
  position: absolute;
  right: 20px;
  bottom: 20px;
  background: #fff5f9;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 0.9rem;
  color: #ff69b4;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.fun-fact-next:hover {
  background: #ffb6c1;
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 5px 10px rgba(255, 105, 180, 0.2);
}

/* Стили для текущего пользователя */
.player-avatar.current-user {
  border: 4px solid #ff69b4 !important;
  box-shadow: 0 0 10px #ff69b4 !important;
  animation: avatarGlow 2s infinite alternate;
}

.list-avatar.current-user {
  border: 3px solid #ff69b4 !important;
  box-shadow: 0 0 8px #ff69b4;
}

.current-user-item {
  background-color: rgba(255, 105, 180, 0.05);
  border-left: 4px solid #ff69b4;
}

@keyframes avatarGlow {
  0% {
    box-shadow: 0 0 5px #ff69b4;
  }
  100% {
    box-shadow: 0 0 15px #ff69b4;
  }
}

/* Адаптивность - улучшена для всех элементов */
@media (max-width: 768px) {
  .top-title {
    font-size: 2.5rem;
  }

  /* Адаптация для блока top-players */
  .top-players {
    flex-direction: column;
    align-items: center;
    height: auto;
    gap: 60px; /* Увеличиваем расстояние между карточками */
    margin-bottom: 60px;
    padding: 50px 20px; /* Добавляем отступы сверху и снизу */
  }

  .player-card {
    width: 220px !important;
    height: auto !important;
    margin: 0 !important;
    padding: 20px;
  }

  /* Фиксируем проблему с короной */
  .crown {
    top: -35px;
    font-size: 2.2rem;
  }

  /* Фиксируем проблему с лентами */
  .ribbon {
    right: -25px;
    width: 80px;
  }

  /* Фиксируем проблему с медалями */
  .medal {
    top: -15px;
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }

  .player-avatar,
  .first-place .player-avatar {
    width: 100px;
    height: 100px;
  }

  .first-place {
    order: -1;
  }

  .second-place {
    order: 0;
  }

  .third-place {
    order: 1;
  }

  /* Адаптация блока с фактом */
  .fun-fact {
    flex-direction: column;
    text-align: center;
    padding: 25px 20px;
  }

  .fun-fact-icon-container {
    margin: 0 0 15px 0;
  }

  .fun-fact-content h3::after {
    left: 50%;
    transform: translateX(-50%);
  }

  .fun-fact-next {
    position: static;
    margin-top: 20px;
  }
}

@media (max-width: 480px) {
  .top-title {
    font-size: 2rem;
  }

  .top-subtitle {
    font-size: 1rem;
  }

  .filter-box {
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .filter-btn {
    width: 100%;
    padding: 10px;
  }

  /* Еще немного уменьшаем размер короны и делаем её выше */
  .crown {
    top: -30px;
    font-size: 2rem;
  }

  /* Ленты делаем чуть меньше и поднимаем выше */
  .ribbon {
    top: 20px;
    width: 70px;
    height: 25px;
  }

  .list-item {
    padding: 12px;
  }

  .list-avatar {
    width: 35px;
    height: 35px;
    margin-right: 12px;
  }

  .list-rank {
    width: 28px;
    height: 28px;
    margin-right: 12px;
    font-size: 0.9rem;
  }

  .list-name {
    font-size: 0.9rem;
  }

  .list-score {
    font-size: 0.9rem;
    padding: 3px 8px;
  }

  .fun-fact-icon {
    font-size: 2rem;
  }

  .fun-fact-content h3 {
    font-size: 1.3rem;
  }

  .fun-fact-content p {
    font-size: 0.9rem;
  }
}
</style>