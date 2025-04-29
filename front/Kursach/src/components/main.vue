<template>
  <div class="app-container">
    <!-- Шапка с валютой -->
    <AppHeader :catClapCount="catClapCount" :catCoinCount="catCoinCount" />
    <div class="main-content">
      <img
        :src="currentCatImage"
        alt="Зайди в магазин и купи своего первого котика!"
        class="cat-image"
        @click="tapCat"
      />

      <!-- Блок с кнопками взаимодействия -->
      <div class="interaction-buttons">
        <button
          class="interaction-btn"
          @click="interact('feed')"
          :disabled="catClapCount < 1000"
        >
          <span class="btn-icon">🐟</span> Покормить <br />
          1 000 👏
        </button>
        <button
          class="interaction-btn"
          @click="interact('pet')"
          :disabled="catClapCount < 1000"
        >
          <span class="btn-icon">💙</span> Приласкать <br />1 000 👏
        </button>
        <button
          class="interaction-btn"
          @click="interact('play')"
          :disabled="catClapCount < 1000"
        >
          <span class="btn-icon">🧶</span> Поиграть <br />
          1 000 👏
        </button>
      </div>
    </div>

    <!-- Аудио -->
    <audio
      ref="meowSound1"
      :src="require('@/assets/meow.mp3')"
      preload="auto"
    ></audio>
    <audio
      ref="meowSound2"
      :src="require('@/assets/meow2.mp3')"
      preload="auto"
    ></audio>
    <audio
      ref="meowSound3"
      :src="require('@/assets/meow3.mp3')"
      preload="auto"
    ></audio>
    <audio
      ref="angrySound"
      :src="require('@/assets/angry.mp3')"
      preload="auto"
    ></audio>
    <audio
      ref="happySound"
      :src="require('@/assets/happy.mp3')"
      preload="auto"
    ></audio>
  </div>
</template>

<script setup>
// Добавьте импорт API в начало скрипта
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import { useCoinsState } from "@/composables/useCoinsState";
import { api } from "@/api"; // Добавлен импорт API для получения данных котов

const { catCoinCount, catClapCount, addClaps, addCoins, loadUserData } =
  useCoinsState();

const router = useRouter();
const userId = ref(localStorage.getItem("userId") || null);
const lastInteractionTime = ref(Date.now());
const mood = ref("normal"); // Изначально нормальное настроение
const tapCount = ref(0);
const lastTapTime = ref(0);
const selectedCat = ref(null);

// Аудио рефы
const meowSound1 = ref(null);
const meowSound2 = ref(null);
const meowSound3 = ref(null);
const angrySound = ref(null);
const happySound = ref(null);

const meowSounds = [meowSound1, meowSound2, meowSound3];
const currentMeowIndex = ref(0);
let meowTimeout = null;

const tapThreshold = 20;
const tapVolumeStep = 0.2;
const maxVolume = 1.0;

// Дефолтные изображения котика
const defaultImages = {
  happy: require("@/assets/cat_happy.png"),
  sad: require("@/assets/cat_sad.png"),
  normal: require("@/assets/cat_normal.png"),
};

// Вычисляемое свойство для изображения кота на основе настроения и выбранного кота
// Улучшить вычисляемое свойство для изображения кота
const currentCatImage = computed(() => {
  // Если есть выбранный кот, используем его изображения
  if (selectedCat.value && selectedCat.value.images) {
    const moodType = mood.value || "normal";
    const catImages = selectedCat.value.images;

    // Проверяем наличие изображения для текущего настроения
    if (catImages[moodType]) {
      console.log(
        `Используем изображение кота для настроения ${moodType}:`,
        catImages[moodType]
      );
      return catImages[moodType];
    } else {
      console.warn(
        `Нет изображения для настроения ${moodType}, используем normal`
      );
      return catImages.normal || defaultImages.normal;
    }
  }

  // Используем дефолтные изображения если нет выбранного кота
  console.log("Используем дефолтное изображение для настроения:", mood.value);
  return defaultImages[mood.value || "normal"];
});

// Загрузка выбранного кота из localStorage

const loadSelectedCat = () => {
  try {
    const savedSelectedCat = localStorage.getItem("selectedCat");
    if (savedSelectedCat) {
      const parsedCat = JSON.parse(savedSelectedCat);
      console.log("Загружен выбранный кот из localStorage:", parsedCat);

      // Проверка на корректность данных изображений
      if (!parsedCat.images || !parsedCat.images.normal) {
        console.warn(
          "У кота отсутствуют корректные данные изображений:",
          parsedCat
        );
        parsedCat.images = parsedCat.images || {
          normal: "/cat_avatars/normal/default.jpg",
          happy: "/cat_avatars/happy/default.jpg",
          sad: "/cat_avatars/sad/default.jpg",
        };
      }

      selectedCat.value = parsedCat;

      // Если настроение было сброшено, установим его на нормальное
      if (!mood.value) mood.value = "normal";
    } else {
      console.log("Нет выбранного кота в localStorage");

      // Проверяем есть ли усыновленные коты
      const adoptedCats = JSON.parse(
        localStorage.getItem("adoptedCats") || "[]"
      );

      if (adoptedCats.length > 0) {
        // Берем первого кота из списка усыновленных
        const firstCat = adoptedCats[0];
        console.log("Выбираем первого приобретенного кота:", firstCat);

        // Проверяем наличие изображений
        if (!firstCat.images || !firstCat.images.normal) {
          firstCat.images = firstCat.images || {
            normal: "/cat_avatars/normal/default.jpg",
            happy: "/cat_avatars/happy/default.jpg",
            sad: "/cat_avatars/sad/default.jpg",
          };
        }

        selectedCat.value = firstCat;
        localStorage.setItem("selectedCat", JSON.stringify(selectedCat.value));
      } else {
        // Если нет приобретенных котов, выбираем случайного из раздела "Новички"
        selectRandomNewbieCat();
      }
    }
  } catch (error) {
    console.error("Ошибка загрузки выбранного кота:", error);
    selectedCat.value = null; // Сбрасываем выбранного кота при ошибке
  }
};

const selectRandomNewbieCat = async () => {
  try {
    console.log("Выбираем случайного кота для нового пользователя...");

    // Получаем доступных новичков с сервера
    const allCats = await api.getCats();

    if (!Array.isArray(allCats) || allCats.length === 0) {
      console.warn("Нет доступных котов на сервере");
      return;
    }

    // Фильтруем котов-новичков (с низкой ценой или помеченных как common)
    const newbieCats = allCats.filter(
      (cat) => cat.rarity === "common" || (cat.price && cat.price <= 100)
    );

    if (newbieCats.length === 0) {
      console.warn("Нет котов-новичков");
      return;
    }

    // Выбираем случайного кота из списка новичков
    const randomCat = newbieCats[Math.floor(Math.random() * newbieCats.length)];
    console.log("Выбран случайный кот-новичок:", randomCat);

    // Форматируем данные кота для сохранения
    const catToSave = {
      id: randomCat._id || randomCat.id,
      title: randomCat.name || "Кот-новичок",
      images: randomCat.images || {
        normal: randomCat.avatar || "/cat_avatars/normal/default.jpg",
        happy: "/cat_avatars/happy/default.jpg",
        sad: "/cat_avatars/sad/default.jpg",
      },
      color: randomCat.color || "Классический",
    };

    // Сохраняем выбранного кота
    selectedCat.value = catToSave;
    localStorage.setItem("selectedCat", JSON.stringify(catToSave));

    console.log("Случайный кот установлен как выбранный:", catToSave);
  } catch (error) {
    console.error("Ошибка при выборе случайного кота:", error);
  }
};

// Обработчик клика по коту
const tapCat = () => {
  addClaps(1);
  lastInteractionTime.value = Date.now();

  const now = Date.now();
  if (now - lastTapTime.value < 300) {
    tapCount.value += 1;
    if (tapCount.value % tapThreshold === 0) {
      clearTimeout(meowTimeout);
      playMeow();
    }
  } else {
    tapCount.value = 1;
  }
  lastTapTime.value = now;

  // Если котик грустный и набрали 100 кликов, возвращаем нормальное настроение
  if (mood.value === "sad" && catClapCount.value >= 100) {
    mood.value = "normal";
  }
};

const playMeow = () => {
  const currentSound = meowSounds[currentMeowIndex.value].value;
  currentSound.volume = Math.min(
    maxVolume,
    (tapCount.value / tapThreshold) * tapVolumeStep
  );
  currentSound.play();
  currentMeowIndex.value = (currentMeowIndex.value + 1) % meowSounds.length;
};

const interact = (action) => {
  if (catClapCount.value < 1000) return;

  catClapCount.value -= 1000;
  catCoinCount.value += 1; // Добавляем монетку за взаимодействие
  lastInteractionTime.value = Date.now();
  mood.value = "happy";
  happySound.value.play();

  // Через 5 минут возвращаем нормальное настроение, если не было других взаимодействий
  setTimeout(() => {
    const minutesSinceLastInteraction =
      (Date.now() - lastInteractionTime.value) / (1000 * 60);
    if (minutesSinceLastInteraction >= 5 && mood.value === "happy") {
      mood.value = "normal";
    }
  }, 5 * 60 * 1000);
};

// Проверка настроения каждую минуту
const moodCheckInterval = setInterval(() => {
  const minutesSinceLastInteraction =
    (Date.now() - lastInteractionTime.value) / (1000 * 60);

  if (minutesSinceLastInteraction > 30 && mood.value !== "happy") {
    mood.value = "sad";
    angrySound.value.play();
  } else if (minutesSinceLastInteraction > 10 && mood.value !== "happy") {
    mood.value = "sad";
  }
}, 60 * 1000); // Проверка каждую минуту

// Инициализация при загрузке
// В блоке onMounted заменить существующий обработчик события catSelected
onMounted(() => {
  loadUserData();
  loadSelectedCat();

  // Исправленный обработчик события для смены кота
  window.addEventListener("catSelected", (event) => {
    console.log("Событие catSelected получено:", event.detail);
    // Принудительно перезагружаем данные выбранного кота из localStorage
    loadSelectedCat();
    // Сбрасываем настроение на нормальное при смене кота
    mood.value = "normal";
  });
});

// Сохранение данных при изменении
const saveData = () => {
  const dataToSave = {
    catClapCount: catClapCount.value,
    catCoinCount: catCoinCount.value,
    lastInteractionTime: lastInteractionTime.value,
    mood: mood.value,
  };
  localStorage.setItem("catAppData", JSON.stringify(dataToSave));
};

// Сохраняем данные периодически и при размонтировании
const saveInterval = setInterval(saveData, 10000);
onUnmounted(() => {
  clearInterval(moodCheckInterval);
  clearInterval(saveInterval);
  clearTimeout(meowTimeout);
  window.removeEventListener("catSelected", loadSelectedCat);
  saveData();
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Poppins:wght@400;600;700&display=swap");

/* Общие стили */
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #fff0f5 0%, #ffe6f0 100%);
  font-family: "Comic Neue", "Poppins", cursive, sans-serif;
  position: relative;
}

/* Шапка */
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
}

.icon {
  width: 28px;
  height: 28px;
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

/* Основной контент */
.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start; /* Изменено для более предсказуемого расположения */
  padding: 20px;
  flex-grow: 1;
  min-height: 70vh;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

/* Адаптация изображения кота */
.cat-image {
  max-width: 80%;
  max-height: 45vh;
  object-fit: contain;
  margin: 20px auto 30px; /* Добавляем auto для горизонтального центрирования */
  cursor: pointer;
  transition: transform 0.1s;
  display: block; /* Гарантирует правильное применение свойства margin */

}

.cat-image:active {
  transform: scale(0.95);
}

/* Кнопки взаимодействия */
.interaction-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 10px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  flex-wrap: wrap;
  box-sizing: border-box;
}

.interaction-btn {
  font-size: 16px;
  background: linear-gradient(to right, #ff8fab, #ff69b4);
  color: white;
  border: none;
  padding: 15px;
  border-radius: 18px; /* Уменьшен радиус для более аккуратного вида */
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 3px 6px rgba(255, 105, 180, 0.15); /* Уменьшена тень */
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px; /* Уменьшен отступ между иконкой и текстом */
  width: 160px;
  height: 100px;
  text-align: center;
  line-height: 1.3;
}

.interaction-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(255, 20, 147, 0.3);
}

.interaction-btn:disabled {
  opacity: 0.6;
  background: linear-gradient(to right, #cccccc, #aaaaaa);
  cursor: not-allowed;
}

.interaction-btn:disabled:hover {
  transform: none;
  box-shadow: 0 4px 8px rgba(255, 105, 180, 0.2);
}

.btn-icon {
  font-size: 24px;
  margin-bottom: 3px;
}

/* Меню */
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
@media (min-width: 1024px) {
  .interaction-btn {
    width: 180px; /* Крупнее на больших экранах */
    height: 110px;
  }
  
  .cat-image {
    max-height: 50vh;
    margin-top: 3vh;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .interaction-buttons {
    flex-wrap: wrap;
    max-width: 600px;
  }

  .interaction-btn {
    width: 170px;
    height: 100px;
  }
  
  .cat-image {
    margin-top: 4vh;
  }
}

@media (max-width: 768px) and (min-width: 481px) {
  .interaction-buttons {
    gap: 15px;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 550px;
  }

  .interaction-btn {
    width: 160px;
    height: 95px;
    font-size: 15px;
  }
  
  .cat-image {
    max-height: 45vh;
    margin-top: 5vh;
  }
}

/* Для планшетов в портретной ориентации */
@media (max-width: 768px) and (orientation: portrait) {
  .cat-image {
    max-height: 40vh;
    margin-top: 6vh;
  }
}

/* Для телефонов */
@media (max-width: 480px) {
  .interaction-buttons {
    flex-direction: column;
    align-items: center;
    gap: 15px;
    padding: 10px 5px;
  }

  .interaction-btn {
    width: 80%;
    max-width: 250px;
    height: 80px; /* Меньше высота для вертикального расположения */
    font-size: 15px;
    padding: 12px;
  }
  
  .btn-icon {
    font-size: 22px;
  }
  
  .cat-image {
    max-height: 38vh;
    margin-top: 3vh;
    margin-bottom: 20px;
  }
  
  .main-content {
    justify-content: flex-start; /* Начинаем с верха экрана */
    padding: 15px 10px;
  }
}

/* Для совсем маленьких экранов */
@media (max-width: 380px) {
  .interaction-btn {
    width: 90%;
    height: 70px;
    font-size: 14px;
    padding: 10px;
    border-radius: 16px;
  }
  
  .btn-icon {
    font-size: 20px;
  }
  
  .cat-image {
    max-height: 35vh;
    margin-top: 2vh;
  }
  
  .main-content {
    padding: 10px 5px;
  }
}

/* Для очень низких экранов */
@media (max-height: 600px) {
  .cat-image {
    max-height: 40vh;
    margin-top: 2vh;
    margin-bottom: 15px;
  }
  
  .interaction-buttons {
    gap: 10px;
  }
  
  .interaction-btn {
    height: 70px;
    padding: 8px;
  }
}

/* Для устройств в альбомной ориентации */
@media (max-height: 500px) and (orientation: landscape) {
  .main-content {
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    gap: 20px;
    padding: 10px;
  }
  
  .cat-image {
    max-width: 45vw;
    max-height: 70vh;
    margin: 0;
  }
  
  .interaction-buttons {
    flex-direction: column;
    width: auto;
    height: 100%;
    justify-content: center;
  }
  
  .interaction-btn {
    width: 150px;
    height: 25vh;
    max-height: 80px;
  }
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

</style>
