<template>
  <div 
    class="cat-card" 
    :class="{ selected: isExpanded || isSelected, owned: props.isOwned }"
    @click="selectCat"
  >
    <!-- Изображение кота - увеличенная высота контейнера -->
    <div class="cat-image-container">
      <div class="mood-images">
        <img
          v-for="(image, mood) in moodImages"
          :key="mood"
          :src="image"
          :alt="`${props.title} - ${mood}`"
          :class="['mood-image', { active: currentMood === mood }]"
          @error="handleImageError"
        />
      </div>
      <span class="cat-color-badge">{{ catColor }}</span>
      <span :class="['cat-badge', rarityClass]">{{ catRank }}</span>
      <span v-if="props.isOwned" class="owned-badge">Приручен</span>
    </div>

    <!-- Информация о коте -->
    <div class="cat-info">
      <h3 class="cat-title">{{ props.title }}</h3>
      <p class="cat-price">
        <span v-if="props.price.includes('🪙')" class="price-coin">{{ props.price }}</span>
        <span v-else class="price-clap">{{ props.price }}</span>
      </p>

      <!-- Дополнительные детали (показываются только при раскрытии карточки) -->
      <transition name="fade">
        <div v-if="isExpanded" class="cat-details">
          <div class="details-content">
            <!-- Характеристики кота -->
            <div class="stats">
              <div class="stat">
                <div class="stat-icon">❤️</div>
                <div class="stat-value">{{ health }}</div>
              </div>
              <div class="stat">
                <div class="stat-icon">⚡</div>
                <div class="stat-value">{{ energy }}</div>
              </div>
            </div>

            <!-- Настроения кота -->
            <div class="cat-moods">
              <div class="mood-title">Настроение котика:</div>
              <div class="mood-selector">
                <div
                  v-for="mood in ['happy', 'normal', 'sad']"
                  :key="mood"
                  :class="['mood-option', { active: currentMood === mood }]"
                  @mouseenter="previewMood(mood)"
                  @mouseleave="previewMood('normal')"
                >
                  {{ mood === "happy" ? "😺" : mood === "normal" ? "😸" : "😿" }}
                </div>
              </div>
            </div>

            <!-- Описание кота -->
            <p class="cat-description">
              {{ props.description || "Очаровательный котик ищет хозяина!" }}
            </p>
          </div>

          <!-- Кнопки действий всегда внизу контейнера -->
          <div class="action-buttons">
            <!-- Если кот не куплен - показываем кнопку "Приручить" -->
            <button
              v-if="!props.isOwned"
              class="btn btn-adopt"
              @click.stop="adoptCat"
            >
              Приручить
            </button>

            <!-- Если кот куплен, но не выбран - показываем кнопку "Выбрать" -->
            <button
              v-else-if="props.isOwned && !props.isSelected"
              class="btn btn-select"
              @click.stop="setActiveCat"
            >
              Выбрать
            </button>

            <!-- Если кот куплен и выбран - показываем неактивный статус "Выбран" -->
            <div
              v-else-if="props.isOwned && props.isSelected"
              class="btn btn-select is-selected"
            >
              Выбран
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, onMounted, watch } from "vue";

// Определяем props с новым интерфейсом для изображений
const props = defineProps({
  id: String,
  title: String,
  price: String,
  description: String,
  images: {
    type: Object,
    default: () => ({
      normal: "/cat_avatars/normal/default.jpg",
      happy: "/cat_avatars/happy/default.jpg",
      sad: "/cat_avatars/sad/default.jpg",
    }),
  },
  image: String, // Для обратной совместимости
  rank: String,
  color: {
    type: String,
    default: "Классический",
  },
  isOwned: {
    type: Boolean,
    default: false,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
});

// В computed-свойстве moodImages меняем пути
const moodImages = computed(() => {
  // Для локалки используем прямой адрес, для прода — относительный путь
  const baseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : '';

  // Исправляем путь к картинкам: всегда через /api/cat_avatars/
  const fixPath = (path) => {
    // Если путь уже абсолютный (http), возвращаем как есть
    if (path.startsWith('http')) return path;
    // Заменяем старые пути на новые
    let fixed = path.replace("/images/cats/", "/cat_avatars/");
    // Убираем /static если вдруг есть
    fixed = fixed.replace(/^\/static/, "");
    // Убедимся, что путь начинается с /
    if (!fixed.startsWith("/")) fixed = "/" + fixed;
    // Добавляем /api если нет
    if (!fixed.startsWith("/api")) fixed = "/api" + fixed;
    return baseUrl + fixed;
  };

  if (props.images && typeof props.images === "object") {
    return {
      normal: fixPath(props.images.normal),
      happy: fixPath(props.images.happy),
      sad: fixPath(props.images.sad),
    };
  }

  // Для обратной совместимости (старый props.image)
  const defaultImage = props.image || "/cat_avatars/normal/white.png";
  return {
    normal: fixPath(defaultImage),
    happy: fixPath(defaultImage),
    sad: fixPath(defaultImage),
  };
});

// Состояние развернутости карточки
const isExpanded = ref(false);

// Определяем события
const emit = defineEmits(["adopt", "select", "set-active"]);

// Выбор/отмена выбора кота
const selectCat = () => {
  // Переключаем состояние развернутости
  isExpanded.value = !isExpanded.value;

  // Вызываем событие для родительского компонента
  if (isExpanded.value) {
    emit("select", {
      id: props.id,
      title: props.title,
      isSelected: true,
      images: moodImages.value,
      color: props.color,
    });
  }
};

// Состояние выбрано ли и куплено ли (теперь получаем через props)
const isAdopted = ref(props.isOwned);
const isGlobalSelected = ref(props.isSelected);
const currentMood = ref("normal");

// Динамически меняем текст кнопки в зависимости от состояния
const buttonState = computed(() => {
  if (props.isOwned) {
    return props.isSelected ? "✓ Выбран" : "Выбрать";
  }
  return "Приручить";
});

// Рандомные характеристики котика
const health = ref(Math.floor(Math.random() * 30) + 70);
const energy = ref(Math.floor(Math.random() * 30) + 70);
const catColor = computed(() => props.color);

const rarityClass = computed(() => {
  if (props.rank === "Fluff Overlord") return "legendary";
  if (props.rank === "Mentor") return "rare";
  return "common";
});

const catRank = computed(() => {
  if (props.rank === "Fluff Overlord") return "🌟 Легендарный";
  if (props.rank === "Mentor") return "🎓 Редкий";
  return "🎀 Обычный";
});

// Обработка ошибки загрузки изображения
const handleImageError = (event) => {
  // Получаем оригинальный путь
  const originalSrc = event.target.src;

  // Выводим информацию об ошибке загрузки
  console.error("Ошибка загрузки изображения:", originalSrc);

  // Пробуем определить тип настроения из URL
  const moodType = originalSrc.includes("/happy/")
    ? "happy"
    : originalSrc.includes("/sad/")
    ? "sad"
    : "normal";

  console.log(`Тип настроения: ${moodType}, попробуем запасной вариант`);

  // Используем запасное изображение с относительным путем
  const baseUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : '';
  
  event.target.src = `${baseUrl}/static/cat_avatars/${moodType}/white.png`;
};

// Установка кота как активного
const setActiveCat = () => {
  emit("set-active", {
    id: props.id,
    title: props.title,
    images: moodImages.value,
    color: props.color,
  });
};

// Покупка кота
const adoptCat = () => {
  emit("adopt", {
    id: props.id,
    title: props.title,
    price: props.price,
    images: moodImages.value,
    color: props.color,
  });
};

// Предпросмотр настроения кота
const previewMood = (mood) => {
  currentMood.value = mood;
};

onMounted(() => {
  // Проверка, куплен ли этот кот уже не нужна, т.к. данные передаются через пропсы
  // Настраиваем текущее настроение
  currentMood.value = "normal";
});

// Наблюдаем за изменениями props и обновляем локальные переменные
watch(
  () => props.isOwned,
  (newValue) => {
    isAdopted.value = newValue;
  }
);

watch(
  () => props.isSelected,
  (newValue) => {
    isGlobalSelected.value = newValue;
  }
);
</script>

<style scoped>
.cat-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.cat-card.selected {
  transform: translateY(-8px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.cat-card.owned {
  border: 2px solid #ffc107;
}

/* Увеличенная высота для контейнера изображения */
.cat-image-container {
  position: relative;
  height: 220px; /* Увеличена высота для полного отображения изображения */
  overflow: hidden;
}

.mood-images {
  position: relative;
  width: 100%;
  height: 100%;
}

.mood-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* Изменено с contain на cover для лучшего отображения */
  transition: opacity 0.3s ease;
  opacity: 0;
}

.mood-image.active {
  opacity: 1;
}

.cat-color-badge {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  padding: 3px 10px;
  border-radius: 15px;
  font-size: 0.7rem;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.cat-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.owned-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(102, 217, 232, 0.9);
  color: white;
  padding: 3px 10px;
  border-radius: 15px;
  font-size: 0.7rem;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.legendary {
  background: linear-gradient(45deg, #ffd700, #ffa500);
  box-shadow: 0 0 10px gold;
}

.rare {
  background: linear-gradient(45deg, #4b0082, #8a2be2);
  box-shadow: 0 0 10px #8a2be2;
}

.common {
  background: linear-gradient(45deg, #20b2aa, #48d1cc);
  box-shadow: 0 0 5px #ff69b4;
}

/* Основная информация о коте */
.cat-info {
  padding: 16px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.cat-title {
  font-size: 1.2rem;
  margin: 0 0 8px 0;
  color: #333;
}

.cat-price {
  font-weight: bold;
  color: #ff69b4;
  margin: 0;
  font-size: 1.1rem;
}

/* Детали карточки при раскрытии */
.cat-details {
  display: flex;
  flex-direction: column;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #eee;
  flex-grow: 1; /* Растягивается, занимая доступное пространство */
}

.details-content {
  flex-grow: 1;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-icon {
  font-size: 1.4rem;
}

.stat-value {
  font-size: 0.9rem;
  margin-top: 4px;
}

.cat-moods {
  margin: 15px 0;
  background: #f9f9f9;
  border-radius: 10px;
  padding: 10px;
}

.mood-title {
  font-size: 0.9rem;
  margin-bottom: 8px;
  color: #666;
  text-align: center;
}

.mood-selector {
  display: flex;
  gap: 8px;
  justify-content: space-around;
}

.mood-option {
  padding: 5px 10px;
  background: #f0f0f0;
  border-radius: 15px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.mood-option:hover {
  background: #e0e0e0;
}

.mood-option.active {
  background: #ff69b4;
  color: white;
}

.cat-description {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
  margin-bottom: 16px;
}

/* Кнопки действий всегда внизу */
.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: auto; /* Кнопки прижаты к низу блока */
}

.btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-adopt {
  background: linear-gradient(to right, #ff69b4, #ff8fab);
  color: white;
  box-shadow: 0 4px 8px rgba(255, 105, 180, 0.3);
}

.btn-select {
  background: linear-gradient(to right, #66d9e8, #48aed5);
  color: white;
  box-shadow: 0 4px 8px rgba(102, 217, 232, 0.3);
}

.btn-select.is-selected {
  background: linear-gradient(to right, #4caf50, #8bc34a);
}

.btn-adopt:hover:not(:disabled),
.btn-select:hover:not(:disabled) {
  transform: translateY(-3px);
}

.btn-adopt:hover:not(:disabled) {
  box-shadow: 0 6px 12px rgba(255, 105, 180, 0.4);
}

.btn-select:hover:not(:disabled) {
  box-shadow: 0 6px 12px rgba(102, 217, 232, 0.4);
}

.btn-adopt:disabled,
.btn-select:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
}

/* Анимации */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Постоянные анимации для цен */
.price-coin {
  display: inline-block;
  animation: coinFloatMobile 3s ease-in-out infinite;
  will-change: transform;
}

.price-clap {
  display: inline-block;
  animation: clapPulseMobile 2s ease-in-out infinite;
  will-change: transform;
}

/* Мобильные анимации (менее интенсивные) */
@keyframes coinFloatMobile {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-3px) rotate(5deg);
  }
}

@keyframes clapPulseMobile {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Десктопные анимации (более выразительные) */
@media (min-width: 769px) {
  .price-coin {
    animation: coinFloatDesktop 3s ease-in-out infinite;
  }

  .price-clap {
    animation: clapPulseDesktop 2s ease-in-out infinite;
  }

  @keyframes coinFloatDesktop {
    0%,
    100% {
      transform: translateY(0) rotate(0deg);
      filter: drop-shadow(0 0 5px gold);
    }
    50% {
      transform: translateY(-5px) rotate(10deg);
      filter: drop-shadow(0 0 10px gold);
    }
  }

  @keyframes clapPulseDesktop {
    0%,
    100% {
      transform: scale(1);
      filter: drop-shadow(0 0 5px #ff69b4);
    }
    50% {
      transform: scale(1.1);
      filter: drop-shadow(0 0 10px #ff69b4);
    }
  }
}

/* Адаптив */
@media (max-width: 768px) {
  .cat-image-container {
    height: 180px;
  }

  .cat-title {
    font-size: 1.1rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .mood-selector {
    flex-wrap: wrap;
  }

  .mood-option {
    flex: 1;
    text-align: center;
    min-width: 80px;
  }
}

/* Обеспечение плавного изменения высоты */
.cat-details {
  overflow: hidden;
  max-height: 1000px; /* достаточно большое значение */
  transition: max-height 0.3s ease;
}
</style>