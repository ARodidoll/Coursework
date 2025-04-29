<template>
  <div class="app-container">
   <AppHeader />
    
    <!-- Основной контент -->
    <div class="about-content">
      <!-- Блок с миссией и котиком -->
      <div class="mission-block">
        <div class="mission-text">
          <h1 class="about-title"> О CatClap</h1>
          <h2>❤️ Наша миссия</h2>
          <p>CatClap-это не просто игра, а способ помочь реальным животным. Часть доходов от донатов мы переводим в приюты для животных.</p>
        </div>
        <div class="mission-cat">
          <img 
            :src="catHappy ? require('@/assets/cat_happy.png') : require('@/assets/cat_normal.png')" 
            alt="Интерактивный котик"
            @mouseover="catHappy = true"
            @mouseleave="catHappy = false"
          />
          <div class="cat-speech" :class="{'visible': catHappy}">
            Спасибо за помощь!
          </div>
        </div>  
      </div>

      <!-- Блок с донатами -->
      <div class="donation-block">
        <h2>💰 Как работают донаты?</h2>
        <p> Когда вы покупаете монеты, 50% от суммы идёт на помощь животным:</p>
        
        <div class="donation-cards">
          <div class="donation-card" v-for="(card, index) in donationCards" :key="index">
            <div class="card-icon">{{ card.emoji }}</div>
            <h3>{{ card.title }}</h3>
            <p>{{ card.description }}</p>
            <div class="card-example">{{ card.example }}</div>
          </div>
        </div>
      </div>

      <!-- Статистика -->
      <div class="stats-block">
        <h2>📊 Наши достижения</h2>
        <div class="stats-grid" v-if="!loading">
          <div class="stat-item">
            <div class="stat-number">{{ stats.savedCats }}</div>
            <div class="stat-label">Спасённых котиков</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ stats.totalDonations }} ₽</div>
            <div class="stat-label">Собрано средств</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ stats.shelterPartners }}</div>
            <div class="stat-label">Приютов-партнёров</div>
          </div>
        </div>
        <div class="loading-indicator" v-else>
          <span>Загрузка статистики...</span>
        </div>
      </div>

      <!-- Прогресс-бар сбора -->
      <div class="progress-block">
        <div class="progress-text">Цель месяца: 10 000 ₽</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{width: progressPercent + '%'}"></div>
        </div>
        <div class="progress-amount">{{ stats.currentMonthAmount }} ₽ из 10 000₽</div>
      </div>
    </div>

    <!-- Модальное окно доната -->
    <div class="modal-overlay" v-if="donateModalOpen" @click="closeDonateModal">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="closeDonateModal">×</button>
        <h2>🐱 Поддержать приюты</h2>
        
        <div class="donate-options">
          <div class="donate-option" 
               v-for="option in donateOptions" 
               :key="option.amount"
               :class="{'selected': selectedAmount === option.amount}"
               @click="selectAmount(option.amount)">
            <span class="amount">{{ option.amount }} ₽</span>
            <span class="bonus">+{{ option.bonus }} 🪙</span>
          </div>
        </div>
        
        <p class="donate-info">50% от суммы пойдёт в приюты для животных</p>
        <button class="confirm-btn" @click="processDonate" :disabled="processing">
          {{ processing ? 'Обработка...' : `Подтвердить ${selectedAmount} ₽` }}
        </button>
      </div>
    </div>

    <!-- Блок с благодарностью -->
    <div class="love-block">
      <h2>Любовь спасёт мир</h2>
      <p>Спасибо, что поддерживаете наш проект! Каждый ваш донат делает мир чуточку добрее. Желаем вам много радости, пушистых мурчаний и счастливых моментов с вашими питомцами!</p>
      <p>С любовью, CatClap ❤️</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AppHeader from '@/components/AppHeader.vue';
import { api } from '@/api';

// Состояния компонента
const catHappy = ref(false);
const donateModalOpen = ref(false);
const selectedAmount = ref(100);
const userId = ref(localStorage.getItem('userId') || null);
const stats = ref({
  savedCats: 0,
  totalDonations: 0,
  shelterPartners: 0,
  currentMonthAmount: 0,
  monthlyGoal: 10000
});
const loading = ref(true);
const processing = ref(false);
const error = ref(null);

// Опции пожертвований
const donateOptions = [
  { amount: 100, bonus: 1000 },
  { amount: 500, bonus: 5500 },
  { amount: 1000, bonus: 12000 },
  { amount: 2000, bonus: 25000 }
];

// Карточки для блока донатов

// Процент заполнения прогресс-бара
const progressPercent = computed(() => {
  const percent = (stats.value.currentMonthAmount / stats.value.monthlyGoal) * 100;
  return Math.min(100, Math.max(0, percent));
});

// Методы
const openDonateModal = () => {
  donateModalOpen.value = true;
};

const closeDonateModal = () => {
  donateModalOpen.value = false;
};

const selectAmount = (amount) => {
  selectedAmount.value = amount;
};

// Загрузка данных с сервера
const loadStats = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const data = await api.getDonationStats();
    stats.value = {
      ...stats.value,
      savedCats: data.savedCats || 0,
      totalDonations: data.totalDonations || 0,
      shelterPartners: data.shelterPartners || 0,
      currentMonthAmount: data.currentMonthAmount || 0,
      monthlyGoal: data.monthlyGoal || 10000
    };
  } catch (err) {
    console.error('Ошибка загрузки статистики:', err);
    error.value = 'Не удалось загрузить статистику. Попробуйте позже.';
  } finally {
    loading.value = false;
  }
};

// Отправка доната на сервер
const processDonate = async () => {
  if (!userId.value) {
    alert('Необходимо авторизоваться, чтобы сделать донат');
    return;
  }
  
  processing.value = true;
  
  try {
    const result = await api.makeDonation(userId.value, selectedAmount.value);
    
    // Обновляем данные на странице
    stats.value.currentMonthAmount += selectedAmount.value / 2;
    stats.value.totalDonations += selectedAmount.value / 2;
    stats.value.savedCats = Math.floor(stats.value.totalDonations / 1000); // Примерная формула
    
    alert(`Спасибо! ${selectedAmount.value/2}₽ будет переведено в приюты.`);
    closeDonateModal();
  } catch (err) {
    console.error('Ошибка при отправке доната:', err);
    alert('Не удалось отправить донат. Проверьте баланс или попробуйте позже.');
  } finally {
    processing.value = false;
  }
};

// Загружаем данные при монтировании компонента
onMounted(() => {
  loadStats();
});
</script>

<style scoped>
/* Общие стили */
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #fff0f5 0%, #ffe6f0 100%);
  font-family: 'Comic Neue', 'Poppins', cursive, sans-serif;
}

/* Шапка */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 25px;
  background: white;
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.1);
}

.logo {
  display: flex;
  align-items: center;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ff69b4;
  margin-left: 10px;
}

.logo img {
  height: 40px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.currency {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.currency-count {
  margin-left: 5px;
  font-weight: bold;
}

.store-btn,
.confirm-btn {
  background: linear-gradient(45deg, #ff69b4, #ff8fab);
  color: white;
  border: none;
  border-radius: 30px;
  padding: 8px 20px;
  font-family: 'Comic Neue', 'Poppins', cursive, sans-serif;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 3px 10px rgba(255, 105, 180, 0.3);
}

.store-btn:hover,
.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.4);
}

/* Основной контент */
.about-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

/* Блок миссии */
.mission-block {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  margin-bottom: 40px;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 30px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(255, 105, 180, 0.15);
  border: 2px solid rgba(255, 182, 193, 0.3);
  position: relative;
  overflow: hidden;
}

.mission-text {
  flex: 1;
  min-width: 300px;
  text-align: center;
}

.about-title {
  color: #ff69b4;
  font-size: 2.8rem;
  margin-bottom: 20px;
  background: linear-gradient(to right, #ff69b4, #ff8fab);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(255, 105, 180, 0.1);
}

h2 {
  color: #ff69b4;
  font-size: 1.8rem;
  margin-bottom: 15px;
}

.mission-text p {
  font-size: 1.2rem;
  line-height: 1.7;
  color: #555;
  max-width: 600px;
  margin: 0 auto;
}

.mission-cat {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 40px;
}

.mission-cat img {
  height: 220px;
  transition: transform 0.5s;
  filter: drop-shadow(0 5px 15px rgba(0,0,0,0.1));
}

.mission-cat img:hover {
  transform: scale(1.08) rotate(3deg);
}

.cat-speech {
  position: absolute;
  top: -50px;
  right: 0;
  background: white;
  padding: 10px 15px;
  border-radius: 15px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.1);
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s;
  font-weight: 600;
  color: #ff69b4;
}

.cat-speech:after {
  content: '';
  position: absolute;
  bottom: -10px;
  right: 30px;
  border-width: 10px 10px 0;
  border-style: solid;
  border-color: white transparent;
}

.cat-speech.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Карточки донатов */
.donation-block {
  background: white;
  border-radius: 25px;
  padding: 40px;
  margin: 50px 0;
  box-shadow: 0 15px 30px rgba(255, 105, 180, 0.1);
  text-align: center;
  position: relative;
}

.donation-block::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  
  background-size: 200% 200%;
  animation: gradient 8s ease infinite;
  border-radius: 25px 25px 0 0;
}

@keyframes gradient {
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

.donation-block h2 {
  margin-bottom: 20px;
  font-size: 2.2rem;
}

.donation-block p {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 30px;
}

.donation-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
  justify-content: center;
}

.donation-card {
  flex: 1;
  min-width: 280px;
  max-width: 350px;
  background: #fff8fa;
  border-radius: 20px;
  padding: 30px 20px;
  box-shadow: 0 10px 25px rgba(255, 105, 180, 0.1);
  text-align: center;
  transition: all 0.3s;
  border: 1px solid rgba(255, 182, 193, 0.3);
}

.donation-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 35px rgba(255, 105, 180, 0.2);
  border-color: rgba(255, 182, 193, 0.6);
}

.card-icon {
  font-size: 3.5rem;
  margin-bottom: 15px;
  display: inline-block;
  animation: bounce 2s ease infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.donation-card h3 {
  color: #ff69b4;
  margin: 10px 0;
  font-size: 1.6rem;
}

.donation-card p {
  margin: 15px 0;
  color: #666;
  font-size: 1rem;
  line-height: 1.5;
}

.card-example {
  margin-top: 20px;
  padding: 10px;
  border-radius: 15px;
  background: #ffecf3;
  color: #ff69b4;
  font-weight: bold;
  font-size: 0.9rem;
}

/* Статистика */
.stats-block {
  margin: 50px 0;
  text-align: center;
}

.stats-block h2 {
  margin-bottom: 30px;
  font-size: 2.2rem;
}

.stats-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
  justify-content: center;
}

.stat-item {
  flex: 1;
  min-width: 250px;
  max-width: 350px;
  background: white;
  border-radius: 20px;
  padding: 30px 20px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(255, 105, 180, 0.1);
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  border: 1px solid rgba(255, 182, 193, 0.2);
}

.stat-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(255, 105, 180, 0.15);
}

.stat-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #ff69b4;
  margin-bottom: 10px;
}

.stat-label {
  color: #666;
  font-size: 1.1rem;
}

/* Прогресс-бар */
.progress-block {
  background: white;
  border-radius: 20px;
  padding: 30px;
  margin: 40px 0;
  box-shadow: 0 10px 25px rgba(255, 105, 180, 0.1);
  text-align: center;
}

.progress-text {
  font-weight: bold;
  margin-bottom: 15px;
  font-size: 1.2rem;
  color: #555;
}

.progress-bar {
  height: 15px;
  background: #ffe6f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #ff8fab, #ff69b4);
  border-radius: 10px;
  transition: width 0.5s;
}

.progress-amount {
  text-align: center;
  margin-top: 15px;
  color: #666;
  font-size: 1.1rem;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  position: relative;
  animation: popIn 0.3s;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

@keyframes popIn {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.donate-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.donate-option {
  background: #f9f9f9;
  border: 2px solid #ddd;
  border-radius: 15px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.donate-option:hover {
  transform: translateY(-3px);
  border-color: #ff8fab;
}

.donate-option.selected {
  background: #ffeffb;
  border-color: #ff69b4;
  box-shadow: 0 5px 10px rgba(255, 105, 180, 0.2);
}

.amount {
  display: block;
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

.bonus {
  display: block;
  margin-top: 8px;
  color: #ff69b4;
}

.donate-info {
  text-align: center;
  margin: 20px 0;
  color: #666;
  font-style: italic;
}

.confirm-btn {
  width: 100%;
  margin-top: 10px;
  padding: 12px;
}

.confirm-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

/* Блок с благодарностью */
.love-block {
  background: white;
  border-radius: 20px;
  padding: 40px;
  margin: 40px 0;
  text-align: center;
  box-shadow: 0 10px 25px rgba(255, 105, 180, 0.1);
  position: relative;
  overflow: hidden;
}

.love-block::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
 
  opacity: 0.03;
  z-index: 0;
}

.love-block h2 {
  margin-bottom: 25px;
  font-size: 2.2rem;
  position: relative;
  z-index: 1;
}

.love-block p {
  line-height: 1.7;
  color: #555;
  margin-bottom: 15px;
  font-size: 1.1rem;
  position: relative;
  z-index: 1;
}

/* Индикатор загрузки */
.loading-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px;
  color: #ff69b4;
  font-weight: bold;
}

/* Адаптивный дизайн */
@media (max-width: 768px) {
  .mission-block {
    flex-direction: column;
    padding: 30px 20px;
  }
  
  .about-title {
    font-size: 2.2rem;
  }
  
  .mission-text p {
    font-size: 1.1rem;
  }
  
  .mission-cat img {
    height: 180px;
  }
  
  .stats-grid {
    flex-direction: column;
    align-items: center;
  }
  
  .stat-item {
    max-width: 100%;
  }
  
  .donation-card {
    min-width: 100%;
  }
  
  .card-icon {
    font-size: 3rem;
  }
  
  .donation-block, 
  .progress-block, 
  .love-block {
    padding: 25px 20px;
  }
}

@media (max-width: 480px) {
  .about-title {
    font-size: 1.8rem;
  }
  
  .mission-block h2,
  .donation-block h2,
  .stats-block h2,
  .love-block h2 {
    font-size: 1.6rem;
  }
  
  .mission-cat img {
    height: 150px;
  }
  
  .stat-number {
    font-size: 2rem;
  }
  
  .donation-options {
    grid-template-columns: 1fr 1fr;
  }
}
</style>