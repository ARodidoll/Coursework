<template>
  <div class="app-container">
    <AppHeader :catClapCount="catClapCount" :catCoinCount="catCoinCount" />
    
    <div class="friend-container">
      <!-- Анимированные элементы фона -->
      <div class="background-elements">
        <div v-for="i in 10" :key="i" class="floating-element" :style="getFloatingStyle(i)"></div>
      </div>
      
      <!-- Заголовок с милым дизайном -->
      <div class="title-container">
        <h1 class="title">
          <span class="title-icon"></span>
          <span class="title-text">Мои друзья</span>
        </h1>
        <div class="title-underline"></div>
      </div>
      
      <!-- Поисковая строка в стиле проекта -->
      <div class="search-container">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            v-model="searchQuery" 
            @input="searchFriends" 
            placeholder="Найти друга по имени..."
            class="search-input"
          />
          <button v-if="searchQuery" class="clear-btn" @click="clearSearch">✕</button>
        </div>
      </div>
      
      <!-- Загрузка -->
      <div v-if="loading" class="loading-container">
        <div class="loading-animation">
          <div class="loading-spinner">😺</div>
          <div class="loading-rings">
            <span></span>
            <span></span>
          </div>
        </div>
        <p class="loading-text">Загружаем ваших друзей...</p>
      </div>
      
      <!-- Список друзей в стиле проекта -->
      <div v-else-if="filteredItems.length > 0" class="friends-list">
        <div 
          v-for="(item, index) in filteredItems" 
          :key="item.id" 
          class="friend-card"
          :class="{'current-user-card': item.id === userId}"
        >
          <!-- Аватар с милой анимацией -->
          <div class="avatar-container" @mouseover="activateCat(item.id)" @mouseleave="deactivateCat(item.id)">
            <img 
              :src="item.avatar" 
              :alt="item.name" 
              class="avatar" 
              :class="{'animated': activeCatId === item.id}"
            />
            <div class="online-dot" v-if="item.isOnline"></div>
            <div class="avatar-effect" v-if="activeCatId === item.id">
              <span class="heart">❤️</span>
              <span class="heart delay-1">❤️</span>
            </div>
          </div>
          
          <div class="friend-info">
            <div class="friend-name">
              {{ item.name }}
              <span class="friend-username" v-if="item.username">@{{ item.username }}</span>
            </div>
            
            <div class="friend-stats">
              <div class="stat">
                <span class="stat-icon">🪙</span>
                <span class="stat-value">{{ item.coins || 0 }}</span>
              </div>
              <div class="stat">
                <span class="stat-icon">👏</span>
                <span class="stat-value">{{ item.claps || 0 }}</span>
              </div>
              <div class="stat online-stat" v-if="item.isOnline">
                <span class="online-pulse"></span>
                <span class="online-text">Онлайн</span>
              </div>
            </div>
          </div>
          
          <div class="friend-actions">
            <button 
              v-if="!item.isFriend && item.id !== userId" 
              class="action-btn add-btn" 
              @click="addFriend(item)"
            >
              <span class="btn-icon">+</span>
              <span class="btn-text">Добавить</span>
            </button>
            <button 
              v-else-if="item.isFriend" 
              class="action-btn remove-btn" 
              @click="removeFriend(item)"
            >
              <span class="btn-icon">−</span>
              <span class="btn-text">Удалить</span>
            </button>
            <div v-else-if="item.id === userId" class="you-label">
              <span class="you-icon">👤</span>
              <span class="you-text">Это вы</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Нет результатов поиска - в стиле проекта -->
      <div v-else class="no-results">
        <div class="no-results-illustration">
          <span class="no-results-icon">😿</span>
        </div>
        <p class="no-results-message">{{ getNoResultsMessage() }}</p>
        <button class="invite-btn" @click="inviteFriend">
          <span class="invite-icon">📧</span>
          <span class="invite-text">Пригласить друзей</span>
        </button>
      </div>
      
      <!-- Секция "Рекомендации" в стиле проекта -->
      <div class="suggestions-section" v-if="suggestions.length > 0">
        <h2 class="section-title">
          <span class="section-title-icon">✨</span>
          <span class="section-title-text">Интересные люди</span>
          <span class="section-title-icon">✨</span>
        </h2>
        
        <div class="suggestions-list">
          <div 
            v-for="(suggestion, index) in suggestions" 
            :key="suggestion.id" 
            class="suggestion-card"
            :class="{'top-suggestion': index === 0}"
          >
            <!-- Метка "Топ" для первой рекомендации -->
            <div class="top-label" v-if="index === 0">Топ</div>
            
            <div class="suggestion-avatar-container" @mouseover="activateCat(suggestion.id + '_sug')" @mouseleave="deactivateCat(suggestion.id + '_sug')">
              <img 
                :src="suggestion.avatar" 
                :alt="suggestion.name" 
                class="suggestion-avatar" 
                :class="{'animated': activeCatId === suggestion.id + '_sug'}" 
              />
            </div>
            
            <div class="suggestion-info">
              <div class="suggestion-name">{{ suggestion.name }}</div>
              <div class="suggestion-details">
                <span class="suggestion-detail" v-if="suggestion.mutual">
                  <span class="detail-icon">👥</span>
                  {{ suggestion.mutual }} общих
                </span>
              </div>
            </div>
            
            <button class="add-friend-btn" @click="addFriend(suggestion)">
              Добавить
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, computed } from 'vue';
import AppHeader from '@/components/AppHeader.vue';
import { useTelegram } from '@/composables/useTelegram';
import { api } from '@/api';

// --- Состояние из useTelegram ---
const { userId, user, isTelegram, shareLink } = useTelegram();

// --- Состояние компонента ---
const catCoinCount = ref(0);
const catClapCount = ref(0);
const searchQuery = ref('');
const loading = ref(true);
const friends = ref([]);
const cats = ref([]);
const suggestions = ref([]);
const error = ref(null);
const activeCatId = ref(null);

// --- Вычисляемые свойства ---

// Обновленная версия для вычисляемого свойства filteredItems
const filteredItems = computed(() => {
  let items = [];
  const query = searchQuery.value.toLowerCase().trim();

  // Добавляем всех пользователей (друзей)
  items = friends.value.filter(item =>
    (item.name && item.name.toLowerCase().includes(query)) ||
    (item.username && item.username.toLowerCase().includes(query))
  );

  // Сортируем: сначала online, затем по имени
  items.sort((a, b) => {
    // Сначала по статусу онлайн
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    
    // Затем по алфавиту
    return a.name.localeCompare(b.name);
  });

  return items;
});

// Ссылка для приглашения друга
const inviteLink = computed(() => {
  const botUsername = "YOUR_BOT_USERNAME";
  const appName = "YOUR_APP_NAME";
  
  if (!userId.value) return '';
  return `https://t.me/${botUsername}/${appName}?startapp=ref${userId.value}`;
});

// Функция для создания стилей плавающих элементов фона
const getFloatingStyle = (index) => {
  const colors = [
    'rgba(128, 81, 255, 0.2)',
    'rgba(255, 81, 168, 0.2)',
    'rgba(81, 197, 255, 0.2)'
  ];
  const size = 8 + Math.random() * 12;
  const left = Math.random() * 100;
  const animationDuration = 15 + Math.random() * 20;
  const animationDelay = Math.random() * 10;
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    backgroundColor: colors[index % colors.length],
    animationDuration: `${animationDuration}s`,
    animationDelay: `${animationDelay}s`
  };
};

// --- Функции ---

// Активация/деактивация анимации аватара при наведении
const activateCat = (id) => { activeCatId.value = id; };
const deactivateCat = (id) => { if (activeCatId.value === id) activeCatId.value = null; };

// Основная функция загрузки данных
const loadData = async () => {
  loading.value = true;
  error.value = null;

  if (!userId.value) {
    console.warn("Friend.vue: userId недоступен. Ожидание ID...");
    loading.value = false;
    error.value = "Не удалось определить пользователя.";
    return;
  }

  console.log(`Friend.vue: Загрузка данных для userId: ${userId.value}`);

  try {
    // 1. Загрузка данных текущего пользователя
    const userData = await api.getUser(userId.value);
    if (userData) {
      catCoinCount.value = userData.coins_count || 0;
      catClapCount.value = userData.claps_count || 0;
    } else {
      console.warn(`Friend.vue: Пользователь с ID ${userId.value} не найден на бэкенде.`);
      catCoinCount.value = 0;
      catClapCount.value = 0;
    }

    // 2. Загрузка списка друзей пользователя
    const friendsData = await api.getUserFriends(userId.value);
    friends.value = (friendsData || []).map(friend => ({
      id: friend.friend_user_id || friend.id,
      name: friend.friend_username || friend.username || 'Друг',
      username: friend.friend_username || friend.username,
      avatar: friend.friend_avatar_url || '/avatars/default.png',
      coins: friend.coins_count || 0,
      claps: friend.claps_count || 0,
      lastInteraction: friend.last_seen || null,
      isFriend: true,
      isOnline: friend.is_online || false
    }));

    // 3. Загрузка рекомендаций
    await loadSuggestions();

  } catch (err) {
    console.error('Ошибка загрузки данных в Friend.vue:', err);
    error.value = 'Не удалось загрузить данные. Попробуйте обновить страницу.';
    friends.value = [];
    suggestions.value = [];
  } finally {
    loading.value = false;
  }
};

// Загрузка рекомендаций
const loadSuggestions = async () => {
  if (!userId.value) return;

  try {
    // Получаем всех пользователей
    const allUsers = await api.getUsers();

    // Отфильтровываем текущего пользователя и уже добавленных друзей
    const filteredUsers = (allUsers || []).filter(u =>
      u.user_id !== userId.value &&
      !friends.value.some(friend => friend.id === u.user_id)
    ).slice(0, 6); // Берем 6 кандидатов

    suggestions.value = filteredUsers.map(u => ({
      id: u.user_id,
      name: u.username || 'Пользователь',
      username: u.username,
      avatar: u.avatar_url || '/avatars/default.png',
      mutual: Math.floor(Math.random() * 5) // Случайное число общих друзей для демонстрации
    }));

  } catch (err) {
    console.error('Ошибка загрузки рекомендаций:', err);
    suggestions.value = [];
  }
};

// --- Действия пользователя ---

// Поиск
const searchFriends = () => { /* Пустая функция, т.к. логика в computed */ };

// Очистка поиска
const clearSearch = () => { searchQuery.value = ''; };

// Добавление друга
const addFriend = async (item) => {
  if (!userId.value) {
    alert("Не удалось определить пользователя. Попробуйте перезагрузить.");
    return;
  }

  try {
    // Добавляем друга
    await api.addFriend(userId.value, item.id);

    // Обновляем локальный список друзей
    friends.value.push({
      id: item.id,
      name: item.name,
      username: item.username,
      avatar: item.avatar,
      coins: 0,
      claps: 0,
      lastInteraction: null,
      isFriend: true,
      isOnline: false
    });
    
    alert(`${item.name} добавлен в друзья!`);

    // Удаляем добавленный элемент из рекомендаций
    suggestions.value = suggestions.value.filter(s => s.id !== item.id);

  } catch (err) {
    console.error('Ошибка при добавлении друга:', err);
    alert('Не удалось добавить друга. Попробуйте позже.');
  }
};

// Удаление друга
const removeFriend = async (friend) => {
  if (!userId.value) {
    alert("Не удалось определить пользователя.");
    return;
  }
  
  if (!confirm(`Вы уверены, что хотите удалить ${friend.name} из друзей?`)) {
    return;
  }

  try {
    await api.removeFriend(userId.value, friend.id);
    friends.value = friends.value.filter(f => f.id !== friend.id);
    alert(`${friend.name} удален из друзей.`);
    // После удаления друга, он может снова появиться в рекомендациях
    await loadSuggestions();
  } catch (err) {
    console.error('Ошибка при удалении друга:', err);
    alert('Не удалось удалить друга. Попробуйте позже.');
  }
};

// Приглашение друга
const inviteFriend = () => {
  if (!inviteLink.value) {
    alert("Не удалось сгенерировать ссылку для приглашения.");
    return;
  }
  
  const inviteText = `Привет! Присоединяйся ко мне в CatClap и давай собирать котиков вместе! 😻 ${inviteLink.value}`;

  if (isTelegram.value) {
    // Используем нативную функцию шаринга Telegram
    shareLink(inviteLink.value, inviteText);
  } else {
    // Fallback для веб-версии (копирование в буфер)
    navigator.clipboard.writeText(inviteText)
      .then(() => alert('Ссылка для приглашения друга скопирована! Поделись ей :)'))
      .catch(err => {
        console.error('Не удалось скопировать ссылку: ', err);
        alert('Не удалось скопировать ссылку. Пожалуйста, скопируйте ее вручную:\n' + inviteText);
      });
  }
};

// --- Вспомогательные функции ---

// Форматирование времени "последний раз был(а)"
const formatLastSeen = (timestamp) => {
  if (!timestamp) return '';
  const now = Date.now();
  const dateTimestamp = new Date(timestamp).getTime();
  const diff = now - dateTimestamp;

  if (isNaN(diff) || diff < 0) return '';

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} д назад`;

  const date = new Date(dateTimestamp);
  return date.toLocaleDateString();
};

// Сообщение при отсутствии результатов поиска
const getNoResultsMessage = () => {
  if (searchQuery.value) {
    return `Ничего не найдено по запросу "${searchQuery.value}"`;
  }
  return 'У вас пока нет друзей в списке';
};

// --- Хук жизненного цикла ---

// Загрузка данных при монтировании компонента
onMounted(() => {
  loadData();
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap");

/* Основные стили контейнера */
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #fff0f5 0%, #ffe6f0 100%);
  font-family: "Comic Neue", cursive, sans-serif;
  color: #444;
  position: relative;
  overflow: hidden;
}

/* Анимированные элементы фона */
.background-elements {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 0;
}

.floating-element {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  opacity: 0.3;
  background-color: #ff4da6;
  animation: float 15s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0);
    opacity: 0.2;
  }
  25% {
    transform: translate(50px, -80px);
    opacity: 0.3;
  }
  50% {
    transform: translate(100px, -40px);
    opacity: 0.15;
  }
  75% {
    transform: translate(50px, 80px);
    opacity: 0.3;
  }
}

.friend-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px 20px;
  position: relative;
  z-index: 1;
}

/* Заголовок в стиле проекта */
.title-container {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  font-weight: 700;
  font-size: 2.5rem;
  color: #ff69b4;
}

.title-icon {
  margin-right: 15px;
  font-size: 2.2rem;
  animation: bounce 2s infinite ease-in-out;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.title-text {
  position: relative;
}



/* Поисковая строка в стиле проекта */
.search-container {
  margin-bottom: 30px;
}

.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 50px;
  padding: 12px 25px;
  box-shadow: 0 8px 20px rgba(255, 105, 180, 0.15);
  transition: all 0.3s ease;
  border: 2px solid #ffb6c1;
}

.search-bar:focus-within {
  box-shadow: 0 10px 25px rgba(255, 105, 180, 0.25);
  transform: translateY(-2px);
}

.search-icon {
  margin-right: 15px;
  font-size: 1.2rem;
  color: #ff69b4;
}

.search-input {
  flex: 1;
  border: none;
  font-size: 1.1rem;
  background: transparent;
  outline: none;
  font-family: "Comic Neue", cursive, sans-serif;
  color: #444;
}

.search-input::placeholder {
  color: #aaa;
}

.clear-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  margin-left: 10px;
  transition: color 0.3s;
}

.clear-btn:hover {
  color: #ff69b4;
}

/* Загрузка в стиле проекта */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.loading-animation {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 25px;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2.5rem;
  z-index: 2;
  animation: rotate 3s linear infinite;
}

@keyframes rotate {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

.loading-rings {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.loading-rings span {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid transparent;
  animation: spinRing 1.5s linear infinite;
}

.loading-rings span:nth-child(1) {
  border-top-color: #ff69b4;
}

.loading-rings span:nth-child(2) {
  border-right-color: #ffb6c1;
  animation-delay: 0.5s;
}

@keyframes spinRing {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 1.2rem;
  color: #ff69b4;
  font-weight: 700;
  animation: fadeInOut 2s ease-in-out infinite;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* Список друзей в стиле проекта */
.friends-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.friend-card {
  display: flex;
  flex-direction: column;
  padding: 25px;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.07);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  background: white;
  border: 2px solid #ffb6c1;
}

.friend-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(255, 105, 180, 0.15);
}

.current-user-card {
  background: #fff5f9;
  border-color: #ff69b4;
  box-shadow: 0 10px 25px rgba(255, 105, 180, 0.2);
}

/* Аватар в стиле проекта */
.avatar-container {
  align-self: center;
  position: relative;
  margin-bottom: 20px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #ffb6c1;
  box-shadow: 0 8px 20px rgba(255, 105, 180, 0.2);
  transition: all 0.3s ease;
}

.avatar.animated {
  transform: scale(1.05);
  border-color: #ff69b4;
}

.avatar-effect {
  position: absolute;
  width: 100%;
  height: 100%;
  top: -10px;
  left: 0;
  pointer-events: none;
}

.heart {
  position: absolute;
  font-size: 1.2rem;
  animation: float-heart 2s ease-in-out;
  opacity: 0;
}

.heart:nth-child(1) {
  top: 0;
  right: 10px;
}

.heart.delay-1 {
  top: -5px;
  left: 10px;
  animation-delay: 0.5s;
}

@keyframes float-heart {
  0% { transform: translateY(0) scale(0); opacity: 0; }
  50% { transform: translateY(-20px) scale(1.3); opacity: 1; }
  100% { transform: translateY(-40px) scale(0.5); opacity: 0; }
}

.online-dot {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 14px;
  height: 14px;
  background: #4caf50;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

/* Информация о друге в стиле проекта */
.friend-info {
  text-align: center;
  margin-bottom: 15px;
}

.friend-name {
  font-size: 1.3rem;
  font-weight: 700;
  color: #444;
  margin-bottom: 8px;
  line-height: 1.3;
}

.friend-username {
  font-size: 0.9rem;
  color: #888;
  font-weight: 400;
  display: block;
  margin-top: 3px;
}

.friend-stats {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #fff5f9;
  padding: 5px 10px;
  border-radius: 20px;
  transition: all 0.3s;
  border: 1px dashed #ffb6c1;
}

.stat:hover {
  background: #ffe6f0;
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 0.9rem;
}

.stat-value {
  font-size: 0.9rem;
  color: #555;
  font-weight: 600;
}

/* Онлайн статус в стиле проекта */
.online-stat {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
  font-weight: 600;
  border-color: #4caf50;
}

.online-pulse {
  width: 8px;
  height: 8px;
  background: #4caf50;
  border-radius: 50%;
  display: inline-block;
  margin-right: 5px;
  animation: pulse-green 2s infinite;
}

.online-text {
  font-size: 0.8rem;
  color: #4caf50;
}

@keyframes pulse-green {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
  }
  
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}

/* Действия с кнопками в стиле проекта */
.friend-actions {
  margin-top: 15px;
  display: flex;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: "Comic Neue", cursive, sans-serif;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  border-radius: 50px;
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
}

.add-btn {
  background: #ff69b4;
  color: white;
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.3);
}

.add-btn:hover {
  background: #ff4da6;
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.4);
  transform: translateY(-2px);
}

.remove-btn {
  background: #f0f0f0;
  color: #666;
}

.remove-btn:hover {
  background: #ffccdd;
  color: #ff4da6;
}

.btn-icon {
  font-size: 1.2rem;
  font-weight: 700;
}

.you-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #fff5f9;
  color: #ff69b4;
  padding: 10px 20px;
  border-radius: 50px;
  font-weight: 700;
  font-size: 0.95rem;
  width: 100%;
  border: 2px dashed #ffb6c1;
}

.you-icon {
  font-size: 1.1rem;
}

/* Блок "Нет результатов" в стиле проекта */
.no-results {
  background: white;
  border-radius: 25px;
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 15px 35px rgba(255, 105, 180, 0.1);
  border: 2px dashed #ffb6c1;
  margin: 40px 0;
}

.no-results-illustration {
  margin: 0 auto 20px;
}

.no-results-icon {
  font-size: 5rem;
  display: block;
  animation: float-slow 3s ease-in-out infinite;
}

@keyframes float-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.no-results-message {
  font-size: 1.3rem;
  color: #555;
  margin-bottom: 25px;
  font-weight: 600;
}

.invite-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #ff69b4;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 25px;
  font-family: "Comic Neue", cursive, sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 20px rgba(255, 105, 180, 0.3);
}

.invite-btn:hover {
  transform: translateY(-3px);
  background: #ff4da6;
  box-shadow: 0 12px 25px rgba(255, 105, 180, 0.4);
}

.invite-icon {
  font-size: 1.3rem;
}

/* Секция рекомендаций в стиле проекта */
.suggestions-section {
  margin-top: 50px;
}

.section-title {
  text-align: center;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.section-title-text {
  color: #ff69b4;
  font-size: 1.8rem;
  font-weight: 700;
}

.section-title-icon {
  font-size: 1.5rem;
  animation: twinkle 3s infinite alternate;
}

@keyframes twinkle {
  0% { opacity: 0.5; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1.2); }
}

.suggestions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.suggestion-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  border: 2px solid #ffb6c1;
}

.suggestion-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(255, 105, 180, 0.15);
}

.top-suggestion {
  border-color: #ff69b4;
  background: #fff5f9;
  box-shadow: 0 10px 25px rgba(255, 105, 180, 0.15);
}

.top-label {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff69b4;
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 15px;
  box-shadow: 0 5px 10px rgba(255, 105, 180, 0.2);
}

.suggestion-avatar-container {
  position: relative;
  margin-bottom: 15px;
}

.suggestion-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #ffb6c1;
  transition: all 0.3s;
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.15);
}

.suggestion-avatar.animated {
  transform: scale(1.05);
  border-color: #ff69b4;
}

.suggestion-info {
  margin-bottom: 15px;
}

.suggestion-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: #444;
  margin-bottom: 8px;
}

.suggestion-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.suggestion-detail {
  font-size: 0.9rem;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.detail-icon {
  font-size: 0.9rem;
  color: #ff69b4;
}

.add-friend-btn {
  background: #ff69b4;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 8px 20px;
  font-family: "Comic Neue", cursive, sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.2);
}

.add-friend-btn:hover {
  background: #ff4da6;
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(255, 105, 180, 0.3);
}

/* Адаптивные стили */
@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }
  
  .friends-list {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
  
  .section-title-text {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.8rem;
    flex-direction: column;
    gap: 10px;
  }
  
  .title-icon {
    margin-right: 0;
    margin-bottom: 5px;
  }
  
  .friends-list {
    grid-template-columns: 1fr;
  }
  
  .suggestions-list {
    grid-template-columns: 1fr;
  }
  
  .friend-actions {
    margin-top: 10px;
    width: 100%;
    text-align: center;
  }
  
  .action-btn, .you-label {
    width: 100%;
  }
}
</style>