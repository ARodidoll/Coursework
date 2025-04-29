<template>
  <div class="app-container">
    <!-- Шапка -->
    <AppHeader :catClapCount="catClapCount" :catCoinCount="catCoinCount" />

    <!-- Основной контент -->
    <div class="store-content" v-if="!loading">
      <h1 class="store-title">🏦 CoinStore 💰</h1>

      <!-- Табы валют -->
      <div class="currency-tabs">
        <button class="tab-btn" :class="{'active': activeTab === 'coins'}" @click="activeTab = 'coins'">
          Купить CatCoins
        </button>
        <button class="tab-btn" :class="{'active': activeTab === 'claps'}" @click="activeTab = 'claps'">
          Купить CatClaps
        </button>
      </div>

      <!-- Список товаров -->
      <div class="products-grid">
        <div class="product-card" v-for="(product, index) in activeProducts" :key="index"
             @click="selectProduct(product)"
             :class="{'selected': selectedProduct?.id === product.id}">
          <div class="product-badge" v-if="product.bestValue">Лучшая цена</div>
          <div class="product-amount">{{ product.amount }} {{ activeTab === 'coins' ? '🪙' : '👏' }}</div>
          <div class="product-price">{{ product.price }} ₽</div>
          <div class="product-bonus" v-if="product.bonus">
            <span class="heart-bonus">+{{ product.bonus }} ❤️</span>
            
          </div>
        </div>
      </div>

      <!-- Кнопка покупки -->
      <button class="buy-btn" @click="buyProduct" :disabled="!selectedProduct">
        Купить за {{ selectedProduct?.price || 0 }} ₽
      </button>

      <!-- Блок с информацией -->
      <div class="info-block">
        <div class="info-icon">💡</div>
        <p>50% от каждой покупки идёт на помощь приютам для животных </p>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-else class="loading-screen">
      <div class="loading-cat">🏦</div>
      <p>Загружаем магазин...</p>
    </div>

    <!-- Модальное окно подтверждения -->
    <div class="modal-overlay" v-if="showModal" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-icon">🎉</div>
        <h2>Покупка успешна!</h2>
        <p>Вы получили {{ purchasedAmount }} {{ purchasedType === 'coins' ? 'CatCoins' : 'CatClaps' }}</p>
        <p class="heart-message">+{{ getPurchasedBonus() }} ❤️ отправлено в приют для котиков</p>

        <button class="modal-btn" @click="showModal = false">Отлично!</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import { api } from '@/api';

const router = useRouter();

// Состояние компонента
const catCoinCount = ref(100);
const catClapCount = ref(50);
const activeTab = ref('coins');
const selectedProduct = ref(null);
const showModal = ref(false);
const purchasedAmount = ref(0);
const purchasedType = ref('');
const purchasedBonus = ref(0);
const animate = ref({ coin: false, clap: false });
const loading = ref(true);
const menuOpen = ref(false);
const userId = ref(localStorage.getItem('userId') || null);

// Данные товаров
const coinProducts = [
  { id: 1, amount: 500, price: 50, bonus: 1 },
  { id: 2, amount: 1200, price: 100, bonus: 2, bestValue: true },
  { id: 3, amount: 3000, price: 200, bonus: 3 },
  { id: 4, amount: 6500, price: 400, bonus: 5 }
];

const clapProducts = [
  { id: 5, amount: 1000, price: 50, bonus: 5 },
  { id: 6, amount: 2500, price: 100, bonus: 15, bestValue: true },
  { id: 7, amount: 6000, price: 200, bonus: 30 },
  { id: 8, amount: 15000, price: 400, bonus: 70 }
];

// Вычисляемые свойства
const activeProducts = computed(() => {
  return activeTab.value === 'coins' ? coinProducts : clapProducts;
});

// Методы
const animateCurrency = (type) => {
  animate.value[type] = true;
  setTimeout(() => animate.value[type] = false, 1000);
};

const selectProduct = (product) => {
  selectedProduct.value = product;
};

const buyProduct = async () => {
  if (!selectedProduct.value) return;

  try {
    let newCoinCount = catCoinCount.value;
    let newClapCount = catClapCount.value;

    // Обновляем соответствующий счетчик
    if (activeTab.value === 'coins') {
      newCoinCount += selectedProduct.value.amount;
    } else {
      newClapCount += selectedProduct.value.amount;
    }
    
    purchasedAmount.value = selectedProduct.value.amount;
    purchasedType.value = activeTab.value;
    purchasedBonus.value = selectedProduct.value.bonus;
    
    // Если пользователь авторизован, сохраняем в БД
    if (userId.value) {
      await api.updateUser(userId.value, {
        coins_count: newCoinCount,
        claps_count: newClapCount
      });
    }
    
    // Сохраняем в локальное хранилище
    catCoinCount.value = newCoinCount;
    catClapCount.value = newClapCount;
    localStorage.setItem('catAppData', JSON.stringify({
      catCoinCount: newCoinCount,
      catClapCount: newClapCount,
      lastInteractionTime: Date.now()
    }));
    
    showModal.value = true;
  } catch (error) {
    console.error('Ошибка при покупке:', error);
    alert('Произошла ошибка при обработке платежа. Пожалуйста, попробуйте снова.');
  }
  
  selectedProduct.value = null;
};

const getPurchasedBonus = () => {
  return purchasedBonus.value || 0;
};

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

const navigateTo = (page) => {
  router.push({ name: page });
  menuOpen.value = false;
};

// Загрузка данных
const loadUserData = async () => {
  try {
    if (userId.value) {
      const userData = await api.getUser(userId.value);
      catCoinCount.value = userData.coins_count || 0;
      catClapCount.value = userData.claps_count || 0;
    } else {
      // Загрузка из localStorage, если нет userId
      const savedData = localStorage.getItem('catAppData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        catCoinCount.value = parsed.catCoinCount || 0;
        catClapCount.value = parsed.catClapCount || 0;
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки данных пользователя:', error);
  }
};

// Хук жизненного цикла
onMounted(async () => {
  await loadUserData();
  setTimeout(() => {
    loading.value = false;
  }, 500);
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
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes clapBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
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

/* Меню */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
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
  box-shadow: -2px 0 15px rgba(0,0,0,0.1);
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
  margin: 0;
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

.menu-content li:last-child {
  border-bottom: none;
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Добавим анимации появления и исчезновения меню и модалок */
.menu-overlay {
  animation: fadeIn 0.3s ease;
}

.modal-overlay {
  animation: fadeIn 0.3s ease;
}


/* Основной контент */
.store-content {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.store-title {
  color: #ff69b4;
  text-align: center;
  margin-bottom: 30px;
  font-size: 2rem;
}

/* Табы */
.currency-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  gap: 10px;
}

.tab-btn {
  padding: 12px 25px;
  background: white;
  border: 2px solid #ffb6c1;
  border-radius: 30px;
  color: #ff69b4;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn.active {
  background: linear-gradient(to right, #ff8fab, #ff69b4);
  color: white;
  border-color: #ff69b4;
}

.tab-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 105, 180, 0.2);
}

/* Товары */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.product-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  border: 2px solid transparent;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(255, 105, 180, 0.1);
}

.product-card.selected {
  border-color: #ff69b4;
  background: #fff5f9;
}

.product-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #ff69b4;
  color: white;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
}

.product-amount {
  font-size: 1.8rem;
  font-weight: bold;
  color: #ff69b4;
  margin-bottom: 10px;
}

.product-price {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.product-bonus {
  font-size: 0.9rem;
  color: #ff69b4;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.heart-bonus {
  color: #ff1493;
  font-size: 1rem;
}

.bonus-text {
  font-size: 0.7rem;
  color: #888;
}

/* Кнопка покупки */
.buy-btn {
  display: block;
  width: 100%;
  max-width: 300px;
  margin: 30px auto;
  padding: 15px;
  font-size: 1.1rem;
  background: linear-gradient(to right, #ff69b4, #ff8fab);
  color: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.3);
  transition: all 0.3s;
}

.buy-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(255, 105, 180, 0.4);
}

.buy-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #cccccc;
}

/* Информационный блок */
.info-block {
  background: white;
  border-radius: 20px;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  max-width: 500px;
  margin: 0 auto;
}

.info-icon {
  font-size: 1.5rem;
}

.info-block p {
  margin: 0;
  color: #666;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 25px;
  text-align: center;
  max-width: 300px;
  width: 90%;
}

.modal-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  animation: bounce 0.5s;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.modal-content h2 {
  color: #ff69b4;
  margin-top: 0;
}

.heart-message {
  color: #ff1493;
  font-weight: bold;
  margin: 10px 0;
}

.modal-btn {
  padding: 10px 25px;
  background: linear-gradient(to right, #ff69b4, #ff8fab);
  color: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  margin-top: 20px;
  font-weight: bold;
  transition: all 0.3s;
}

.modal-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 105, 180, 0.3);
}

/* Адаптивность */
@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .store-title {
    font-size: 1.8rem;
  }
}

@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .currency-tabs {
    flex-direction: column;
  }
  
  .tab-btn {
    width: 100%;
  }
  
   .menu-content {
    width: 100%;
    padding: 20px;
  }
}

/* Добавляем стили для экрана загрузки */
.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
}

.loading-cat {
  font-size: 3rem;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

/* Анимации для десктопа */
@media (min-width: 380px) {
  .animated-coin {
    animation: coinGlowDesktop 2s ease-in-out infinite;
  }

  .animated-clap {
    animation: clapBounceDesktop 1.5s ease-in-out infinite;
  }

  @keyframes coinGlowDesktop {
    0%, 100% { 
      transform: scale(1);
      filter: drop-shadow(0 0 5px gold);
    }
    50% { 
      transform: scale(1.05);
      filter: drop-shadow(0 0 10px gold);
    }
  }

  @keyframes clapBounceDesktop {
    0%, 100% { 
      transform: translateY(0);
      filter: drop-shadow(0 0 5px #ff69b4);
    }
    50% { 
      transform: translateY(-3px);
      filter: drop-shadow(0 0 8px #ff69b4);
    }
  }
}
</style>