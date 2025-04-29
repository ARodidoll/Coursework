<template>
  <div class="app-container">
    <AppHeader :catClapCount="catClapCount" :catCoinCount="catCoinCount" />

    <div class="store-container">
      <h1 class="title">🛒 Магазин котиков</h1>

      <!-- Блок инструкций -->
      <div class="instructions">
        <div class="instruction-icon">🐱</div>
        <div class="instruction-text">
          <p>
            Выбирайте котиков разных окрасов и редкости. Нажмите на карточку
            чтобы увидеть подробности!
          </p>
        </div>
      </div>

      <!-- Фильтры -->
      <div class="filters">
        <div class="filter-group">
          <span class="filter-label">Сортировка:</span>
          <select
            v-model="sortOption"
            class="filter-select"
            @change="applySorting"
          >
            <option value="price-asc">По цене (возр.)</option>
            <option value="price-desc">По цене (убыв.)</option>
            <option value="rarity">По редкости</option>
            <option value="color">По окрасу</option>
          </select>
        </div>

        <div class="filter-group" v-if="!loading">
          <span class="filter-label">Показать:</span>
          <div class="filter-buttons">
            <button
              class="filter-btn"
              :class="{ active: activeCategory === 'all' }"
              @click="setCategory('all')"
            >
              Все
            </button>
            <button
              class="filter-btn"
              :class="{ active: activeCategory === 'common' }"
              @click="setCategory('common')"
            >
              Обычные
            </button>
            <button
              class="filter-btn"
              :class="{ active: activeCategory === 'rare' }"
              @click="setCategory('rare')"
            >
              Редкие
            </button>
            <button
              class="filter-btn"
              :class="{ active: activeCategory === 'legendary' }"
              @click="setCategory('legendary')"
            >
              Легендарные
            </button>
          </div>
        </div>
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="loading">
        <div class="loading-spinner">😺</div>
        <p>Ищем котиков...</p>
      </div>

      <!-- Секции с котами -->
      <div v-else>
        <div
          v-for="(section, index) in filteredSections"
          :key="index"
          class="section"
        >
          <div class="section-header">
            <h2 class="section-title">{{ section.title }}</h2>
            <p class="section-subtitle">{{ section.subtitle }}</p>
          </div>

          <div
            class="cards-grid"
            :class="{ 'legend-cards': section.rank === 'Fluff Overlord' }"
          >
            <CatSection
              v-for="(cat, idx) in section.cats"
              :key="`cat-${cat.id}-${isOwnedCat(cat.id)}-${isSelectedCat(
                cat.id
              )}-${idx}`"
              :id="cat.id"
              :title="cat.title"
              :price="cat.price"
              :images="cat.images"
              :rank="section.rank"
              :color="cat.color || 'Классический'"
              :description="cat.bio"
              :isOwned="isOwnedCat(cat.id)"
              :isSelected="isSelectedCat(cat.id)"
              @select="onCatSelect"
              @set-active="setSelectedCat"
              @adopt="adoptCat"
            />
          </div>
        </div>

        <!-- Если нет котов после фильтрации -->
        <div v-if="filteredSections.length === 0" class="no-results">
          <div class="no-results-icon">🙀</div>
          <p>Котики по указанному фильтру не найдены</p>
          <button class="reset-btn" @click="resetFilters">
            Сбросить фильтры
          </button>
        </div>
      </div>

      <!-- Модальное окно для успешной покупки -->
      <transition name="fade">
        <div v-if="showAdoptModal" class="adopt-modal">
          <div class="adopt-modal-content">
            <div class="adopt-modal-icon">🎉</div>
            <h3>Поздравляем!</h3>
            <p>Вы успешно приручили {{ adoptedCat.title }}!</p>
            <div class="adopt-modal-image">
              <img :src="adoptedCat.images.happy" :alt="adoptedCat.title" />
            </div>
            <div class="adopt-modal-actions">
              <button class="btn-view" @click="viewAdoptedCat">
                Посмотреть
              </button>
              <button class="btn-close" @click="closeAdoptModal">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- Затемнение для модального окна -->
      <div
        v-if="showAdoptModal"
        class="modal-overlay"
        @click="closeAdoptModal"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import CatSection from "@/components/CatSection.vue";
import { api } from "@/api";
import { useCoinsState } from "@/composables/useCoinsState"; // Импорт composable

// Используем composable для работы с монетами и хлопками
const { 
  catCoinCount, 
  catClapCount, 
  removeCoins, 
  removeClaps, 
  loadUserData 
} = useCoinsState();

// Состояние компонента
const router = useRouter();
const loading = ref(true);
const userId = ref(localStorage.getItem("userId") || null);
const selectedCat = ref(null);
const sortOption = ref("price-asc");
const activeCategory = ref("all");
const adoptedCat = ref({});
const showAdoptModal = ref(false);

// Секции котов с поддержкой изображений разных настроений
const sections = ref([
  {
    title: "🎀 Новички",
    subtitle: "Mousers Level",
    rank: "Mouser",
    cats: [
      {
        id: "cat1",
        title: "Котенок Том",
        price: "🪙 10",
        images: {
          normal: "/images/cats/normal/cat1.png",
          happy: "/images/cats/happy/cat1.png",
          sad: "/images/cats/sad/cat1.png",
        },
        color: "Классический",
      },
      {
        id: "cat2",
        title: "Киса Мурка",
        price: "🪙 15",
        images: {
          normal: "/images/cats/normal/cat2.png",
          happy: "/images/cats/happy/cat2.png",
          sad: "/images/cats/sad/cat2.png",
        },
        color: "Трехцветный",
      },
      {
        id: "cat3",
        title: "Рыжик",
        price: "👏 1500",
        images: {
          normal: "/images/cats/normal/cat3.png",
          happy: "/images/cats/happy/cat3.png",
          sad: "/images/cats/sad/cat3.png",
        },
        color: "Моноцветный",
      },
      {
        id: "cat4",
        title: "Пушок",
        price: "👏 2000",
        images: {
          normal: "/images/cats/normal/cat4.png",
          happy: "/images/cats/happy/cat4.png",
          sad: "/images/cats/sad/cat4.png",
        },
        color: "Пятнистый",
      },
    ],
  },
  {
    title: "🎓 Наставники",
    subtitle: "Mentors Level",
    rank: "Mentor",
    cats: [
      {
        id: "cat5",
        title: "Старый Барсик",
        price: "🪙 50",
        images: {
          normal: "/images/cats/normal/cat5.png",
          happy: "/images/cats/happy/cat5.png",
          sad: "/images/cats/sad/cat5.png",
        },
        color: "Пятнистый",
      },
      {
        id: "cat6",
        title: "Учитель Котофей",
        price: "🪙 60",
        images: {
          normal: "/images/cats/normal/cat6.png",
          happy: "/images/cats/happy/cat6.png",
          sad: "/images/cats/sad/cat6.png",
        },
        color: "Биколор",
      },
      {
        id: "cat7",
        title: "Мудрый Маркиз",
        price: "👏 5000",
        images: {
          normal: "/images/cats/normal/cat7.png",
          happy: "/images/cats/happy/cat7.png",
          sad: "/images/cats/sad/cat7.png",
        },
        color: "Колор-пойнт",
      },
    ],
  },
  {
    title: "🌟 Легенды",
    subtitle: "Fluff Overlords",
    rank: "Fluff Overlord",
    cats: [
      {
        id: "cat8",
        title: "Король Леопольд",
        price: "🪙 100",
        images: {
          normal: "/images/cats/normal/cat8.png",
          happy: "/images/cats/happy/cat8.png",
          sad: "/images/cats/sad/cat8.png",
        },
        color: "Колор-пойнт",
      },
      {
        id: "cat9",
        title: "Император Мяу",
        price: "🪙 150",
        images: {
          normal: "/images/cats/normal/cat9.png",
          happy: "/images/cats/happy/cat9.png",
          sad: "/images/cats/sad/cat9.png",
        },
        color: "Моноцветный",
      },
      {
        id: "cat10",
        title: "Космическая Китти",
        price: "👏 10000",
        images: {
          normal: "/images/cats/normal/cat10.png",
          happy: "/images/cats/happy/cat10.png",
          sad: "/images/cats/sad/cat10.png",
        },
        color: "Биколор",
      },
    ],
  },
]);

// Отфильтрованные секции на основе текущих фильтров
const filteredSections = computed(() => {
  if (activeCategory.value === "all") {
    return sections.value;
  }

  // Фильтруем по категории
  return sections.value.filter((section) => {
    if (activeCategory.value === "common" && section.rank === "Mouser")
      return true;
    if (activeCategory.value === "rare" && section.rank === "Mentor")
      return true;
    if (
      activeCategory.value === "legendary" &&
      section.rank === "Fluff Overlord"
    )
      return true;
    return false;
  });
});

// Методы сортировки и фильтрации
const applySorting = () => {
  sections.value.forEach((section) => {
    switch (sortOption.value) {
      case "price-asc":
        section.cats.sort((a, b) => {
          const priceA = parseInt(a.price.match(/\d+/)[0]);
          const priceB = parseInt(b.price.match(/\d+/)[0]);
          return priceA - priceB;
        });
        break;

      case "price-desc":
        section.cats.sort((a, b) => {
          const priceA = parseInt(a.price.match(/\d+/)[0]);
          const priceB = parseInt(b.price.match(/\d+/)[0]);
          return priceB - priceA;
        });
        break;

      case "rarity":
        section.cats.sort((a, b) => {
          const priceA = parseInt(a.price.match(/\d+/)[0]);
          const priceB = parseInt(b.price.match(/\d+/)[0]);
          return priceB - priceA;
        });
        break;

      case "color":
        section.cats.sort((a, b) => {
          return a.color.localeCompare(b.color);
        });
        break;
    }
  });
};

const setCategory = (category) => {
  activeCategory.value = category;
};

const resetFilters = () => {
  activeCategory.value = "all";
  sortOption.value = "price-asc";
  applySorting();
};

// Обработчик выбора кота
const onCatSelect = (cat) => {
  // Сохраняем информацию о выбранном коте для отображения деталей
  selectedCat.value = cat;

  // Можно также добавить прокрутку к выбранной карточке, если нужно
  setTimeout(() => {
    const selectedElement = document.querySelector(".cat-card.selected");
    if (selectedElement) {
      selectedElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 100);
};

// Обработка покупки кота с использованием useCoinsState
const adoptCat = async (cat) => {
  try {
    // Проверка наличия средств
    const price = parseInt(cat.price.match(/\d+/)[0]);
    const isPriceCoin = cat.price.includes("🪙");
    
    console.log(`Попытка покупки кота: ${cat.title}, Цена: ${price} ${isPriceCoin ? "монет" : "хлопков"}`);
    console.log(`Текущий баланс: ${catCoinCount.value} монет, ${catClapCount.value} хлопков`);

    // Получаем чистый ID
    let cleanId;
    if (typeof cat.id === "object") {
      if (cat.id.$oid) cleanId = cat.id.$oid;
      else if (cat.id._id) cleanId = cat.id._id;
      else if (cat.id.id) cleanId = cat.id.id;
      else cleanId = String(cat.id);
    } else {
      cleanId = String(cat.id);
    }
    console.log(`Извлечен ID кота: ${cleanId}, исходный тип: ${typeof cat.id}`);

    // Проверяем, не куплен ли уже этот кот
    const adoptedCats = JSON.parse(localStorage.getItem("adoptedCats") || "[]");
    console.log(`Текущие приобретенные коты: ${JSON.stringify(adoptedCats.map(c => c.id))}`);
    
    const alreadyOwned = adoptedCats.some(
      (adoptedCat) => String(adoptedCat.id) === cleanId
    );

    if (alreadyOwned) {
      console.log(`Кот ${cat.title} уже куплен`);
      alert(
        `Вы уже приручили ${cat.title}! Можете выбрать его на главном экране.`
      );
      return;
    }

    // Проверка достаточно ли средств
    if (isPriceCoin && catCoinCount.value < price) {
      console.log(`Недостаточно монет: нужно ${price}, есть ${catCoinCount.value}`);
      alert(`Недостаточно монет! Необходимо ${price} 🪙. У вас: ${catCoinCount.value}`);
      return;
    }

    if (!isPriceCoin && catClapCount.value < price) {
      console.log(`Недостаточно хлопков: нужно ${price}, есть ${catClapCount.value}`);
      alert(`Недостаточно хлопков! Необходимо ${price} 👏. У вас: ${catClapCount.value}`);
      return;
    }

    // Списываем монеты или хлопки через useCoinsState
    if (isPriceCoin) {
      removeCoins(price, userId.value);
      console.log(`Списано ${price} монет, новый баланс: ${catCoinCount.value}`);
    } else {
      removeClaps(price, userId.value);
      console.log(`Списано ${price} хлопков, новый баланс: ${catClapCount.value}`);
    }

    // Добавляем кота в список приобретенных
    const catToAdd = {
      id: cleanId,
      title: cat.title,
      images: cat.images,
      color: cat.color,
      dateAdopted: new Date().toISOString(),
    };
    adoptedCats.push(catToAdd);

    localStorage.setItem("adoptedCats", JSON.stringify(adoptedCats));
    console.log(`Кот ${cat.title} успешно приручен с ID: ${cleanId}`);
    console.log(`Обновленный список котов: ${JSON.stringify(adoptedCats.map(c => c.id))}`);

    // Если пользователь авторизован, сохраняем кота в БД
    if (userId.value) {
      await api.addCatToUser(userId.value, {
        cat_id: cleanId,
        name: cat.title,
        images: cat.images,
        color: cat.color,
        purchase_date: new Date().toISOString()
      });
    }

    // Показываем модальное окно успешной покупки
    adoptedCat.value = { ...cat, id: cleanId };
    showAdoptModal.value = true;

    // Устанавливаем кота как выбранного, если это первый кот пользователя
    const isFirstCat = adoptedCats.length === 1;
    if (isFirstCat) {
      await setSelectedCat(adoptedCat.value);
    }

    // ВАЖНО: Принудительно обновляем UI для отображения изменений
    sections.value = JSON.parse(JSON.stringify(sections.value));
  } catch (error) {
    console.error("Ошибка при покупке кота:", error);
    alert("Произошла ошибка при покупке кота, попробуйте еще раз");
  }
};

// Проверка владения котом
const isOwnedCat = (catId) => {
  try {
    // Если ID не определен, прерываем выполнение
    if (!catId) {
      return false;
    }

    // Получаем данные о купленных котах
    const adoptedCats = JSON.parse(localStorage.getItem("adoptedCats") || "[]");

    // Извлекаем чистый ID для сравнения
    let checkIdStr;

    if (typeof catId === "object") {
      if (catId.$oid) checkIdStr = catId.$oid;
      else if (catId._id) checkIdStr = catId._id;
      else if (catId.id) checkIdStr = catId.id;
      else checkIdStr = String(catId);
    } else {
      checkIdStr = String(catId);
    }

    // Проверяем по каждому коту в списке купленных
    for (const cat of adoptedCats) {
      if (!cat || !cat.id) continue;

      // Получаем ID купленного кота в строковом формате
      let adoptedIdStr = String(cat.id);

      // Проверка на идентичность ID
      if (checkIdStr === adoptedIdStr) {
        return true;
      }
    }

    // Кот не найден в списке
    return false;
  } catch (error) {
    console.error("Ошибка при проверке владения котом:", error);
    return false;
  }
};

// Проверка выбранного кота
const isSelectedCat = (catId) => {
  try {
    const selectedCatData = JSON.parse(
      localStorage.getItem("selectedCat") || "{}"
    );

    // Если нет выбранного кота или ID не передан
    if (!selectedCatData.id || !catId) {
      return false;
    }

    // ИСПРАВЛЕНИЕ: Корректно извлекаем ID выбранного кота
    let selectedCatId = selectedCatData.id;
    if (typeof selectedCatId === "object") {
      if (selectedCatId.$oid) selectedCatId = selectedCatId.$oid;
      else if (selectedCatId._id) selectedCatId = selectedCatId._id;
      else if (selectedCatId.id) selectedCatId = selectedCatId.id;
    }
    selectedCatId = String(selectedCatId);

    // ИСПРАВЛЕНИЕ: Корректно извлекаем ID проверяемого кота
    let currentCatId = catId;
    if (typeof currentCatId === "object") {
      if (currentCatId.$oid) currentCatId = currentCatId.$oid;
      else if (currentCatId._id) currentCatId = currentCatId._id;
      else if (currentCatId.id) currentCatId = currentCatId.id;
    }
    currentCatId = String(currentCatId);

    // Строгое сравнение строк
    return selectedCatId === currentCatId;
  } catch (error) {
    console.error("Ошибка при проверке выбранного кота:", error);
    return false;
  }
};

// Установка выбранного кота
const setSelectedCat = async (cat) => {
  try {
    // Проверка валидности данных
    if (!cat) {
      console.error("Невозможно установить кота: передан пустой объект");
      return;
    }

    // Распаковываем объект для корректной работы с данными
    const catData = JSON.parse(JSON.stringify(cat));

    if (!catData.id) {
      console.error("Невозможно установить кота: отсутствует ID");
      return;
    }

    // Правильно извлекаем ID из MongoDB ObjectId
    let catId;
    if (typeof catData.id === "object") {
      if (catData.id.$oid) catId = catData.id.$oid;
      else if (catData.id._id) catId = catData.id._id;
      else if (catData.id.id) catId = catData.id.id;
      else catId = String(catData.id);
    } else {
      catId = String(catData.id);
    }

    // Проверяем, принадлежит ли кот пользователю
    const isOwned = isOwnedCat(catId);
    if (!isOwned) {
      console.log("Кот не может быть выбран, так как не принадлежит пользователю");
      return;
    }

    // Сохраняем в БД если пользователь авторизован
    if (userId.value) {
      try {
        await api.setUserSelectedCat(userId.value, catId);
      } catch (error) {
        console.warn("Не удалось сохранить выбранного кота в БД:", error);
      }
    }

    // Сохраняем в localStorage
    const catToSave = {
      id: catId,
      title: catData.title,
      images: catData.images,
      color: catData.color,
    };

    localStorage.setItem("selectedCat", JSON.stringify(catToSave));

    // Генерируем событие о смене кота
    window.dispatchEvent(
      new CustomEvent("catSelected", {
        detail: { id: catId, title: catData.title, color: catData.color },
      })
    );

    // Принудительное обновление UI
    sections.value = [...sections.value];
  } catch (error) {
    console.error("Ошибка при установке кота:", error);
  }
};

// Методы для модального окна
const closeAdoptModal = () => {
  showAdoptModal.value = false;
};

const viewAdoptedCat = () => {
  showAdoptModal.value = false;
  router.push({ name: "main" });
};

// Загрузка данных при монтировании компонента
onMounted(async () => {
  try {
    // Загружаем данные пользователя через useCoinsState
    await loadUserData(userId.value);
    console.log(`Загружен баланс: ${catCoinCount.value} монет, ${catClapCount.value} хлопков`);

    // Логируем данные о котах для отладки
    console.log("Текущие приобретенные коты:", localStorage.getItem("adoptedCats"));
    console.log("Выбранный кот в localStorage:", localStorage.getItem("selectedCat"));

    // Получаем котов с сервера через api-клиент (axios)
    let response = [];
    try {
      response = await api.getCats();
    } catch (err) {
      console.error("Ошибка загрузки котов через api.getCats:", err);
      response = [];
    }

    if (Array.isArray(response)) {
      // Преобразуем полученные данные в наш формат секций
      const catsByRarity = {
        common: [],
        rare: [],
        legendary: [],
      };

      response.forEach((cat) => {
        const catItem = {
          id: cat._id || cat.id,
          title: cat.name,
          price: cat.price ? `🪙 ${cat.price}` : "🪙 50",
          images: cat.images || {
            normal: cat.avatar || "/cat_avatars/normal/default.jpg",
            happy: "/cat_avatars/happy/default.jpg",
            sad: "/cat_avatars/sad/default.jpg",
          },
          color: cat.color || "Классический",
          bio: cat.bio || "Очаровательный котик ищет хозяина!",
        };

        if (cat.rarity === "legendary" || cat.price > 400) {
          catsByRarity.legendary.push(catItem);
        } else if (cat.rarity === "rare" || cat.price > 100) {
          catsByRarity.rare.push(catItem);
        } else {
          catsByRarity.common.push(catItem);
        }
      });

      sections.value = [
        {
          title: "🎀 Новички",
          subtitle: "Mousers Level",
          rank: "Mouser",
          cats: catsByRarity.common,
        },
        {
          title: "🎓 Наставники",
          subtitle: "Mentors Level",
          rank: "Mentor",
          cats: catsByRarity.rare,
        },
        {
          title: "🌟 Легенды",
          subtitle: "Fluff Overlords",
          rank: "Fluff Overlord",
          cats: catsByRarity.legendary,
        },
      ];

      sections.value = sections.value.filter(
        (section) => section.cats.length > 0
      );

      applySorting();
    }

    loading.value = false;
  } catch (error) {
    console.error("Ошибка загрузки данных:", error);
    loading.value = false;
  }
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Poppins:wght@400;600;700&display=swap");

.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #fff0f5 0%, #ffe6f0 100%);
  font-family: "Comic Neue", "Poppins", cursive, sans-serif;
}

.store-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.title {
  text-align: center;
  color: #ff69b4;
  font-size: 2rem;
  margin: 20px 0;
}

/* Инструкции */
.instructions {
  background: white;
  border-radius: 16px;
  padding: 15px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.5s ease;
}

.instruction-icon {
  font-size: 2.5rem;
  margin-right: 15px;
  animation: bounce 3s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.instruction-text p {
  margin: 0;
  color: #555;
  line-height: 1.5;
}

/* Фильтры */
.filters {
  margin-bottom: 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: space-between;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 15px;
}

.filter-label {
  font-weight: bold;
  color: #555;
}

.filter-select {
  padding: 10px 15px;
  border-radius: 20px;
  border: 2px solid #ffb6c1;
  background: white;
  color: #333;
  font-family: "Comic Neue", "Poppins", cursive, sans-serif;
  cursor: pointer;
  outline: none;
  transition: all 0.3s;
}

.filter-select:focus {
  border-color: #ff69b4;
  box-shadow: 0 0 0 3px rgba(255, 105, 180, 0.2);
}

.filter-buttons {
  display: flex;
  gap: 10px;
}

.filter-btn {
  padding: 8px 15px;
  border-radius: 20px;
  border: 2px solid #ffb6c1;
  background: white;
  color: #ff69b4;
  font-family: "Comic Neue", "Poppins", cursive, sans-serif;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 105, 180, 0.2);
}

.filter-btn.active {
  background: #ff69b4;
  color: white;
  border-color: #ff69b4;
}

/* Секции */
.section {
  margin-bottom: 50px;
  animation: fadeIn 0.5s ease;
}

.section-header {
  margin-bottom: 20px;
  position: relative;
  padding-left: 20px;
 
}

.section-title {
  font-size: 1.8rem;
  margin: 0 0 5px 0;
  color: #333;
}

.section-subtitle {
  color: #888;
  margin: 0;
  font-size: 1rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
}

.legend-cards {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

/* Загрузка */
.loading {
  text-align: center;
  padding: 60px 0;
}

.loading-spinner {
  font-size: 4rem;
  animation: spin 2s linear infinite;
  display: inline-block;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading p {
  color: #ff69b4;
  font-size: 1.2rem;
}

/* Нет результатов */
.no-results {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  margin: 30px 0;
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.1);
}

.no-results-icon {
  font-size: 5rem;
  margin-bottom: 20px;
}

.no-results p {
  color: #666;
  margin-bottom: 30px;
  font-size: 1.3rem;
}

.reset-btn {
  background: linear-gradient(45deg, #ff69b4, #ff8fab);
  color: white;
  border: none;
  border-radius: 30px;
  padding: 12px 30px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-family: "Comic Neue", "Poppins", cursive, sans-serif;
}

.reset-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(255, 105, 180, 0.3);
}

/* Модальное окно */
.adopt-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-width: 500px;
  width: 90%;
  text-align: center;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
}

.adopt-modal-icon {
  font-size: 3rem;
  margin-bottom: 20px;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.adopt-modal h3 {
  color: #ff69b4;
  font-size: 1.8rem;
  margin: 0 0 10px 0;
}

.adopt-modal p {
  font-size: 1.2rem;
  color: #555;
  margin-bottom: 20px;
}

.adopt-modal-image {
  margin: 20px 0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.2);
}

.adopt-modal-image img {
  width: 100%;
  height: auto;
  display: block;
}

.adopt-modal-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.btn-view,
.btn-close {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  border: none;
  font-family: "Comic Neue", "Poppins", cursive, sans-serif;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-view {
  background: #ff69b4;
  color: white;
  box-shadow: 0 4px 10px rgba(255, 105, 180, 0.3);
}

.btn-close {
  background: #f5f5f5;
  color: #555;
}

.btn-view:hover,
.btn-close:hover {
  transform: translateY(-3px);
}

.btn-view:hover {
  box-shadow: 0 6px 15px rgba(255, 105, 180, 0.4);
}

/* Анимации */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Адаптивные стили */
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .filter-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .filter-buttons {
    width: 100%;
    justify-content: space-between;
  }

  .filter-btn {
    flex: 1;
    text-align: center;
    padding: 8px 5px;
  }

  .filter-select {
    width: 100%;
  }

  .cards-grid {
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .store-container {
    padding: 15px;
  }

  .cards-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .legend-cards {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .adopt-modal {
    padding: 20px;
  }

  .adopt-modal-actions {
    flex-direction: column;
  }
}
</style>