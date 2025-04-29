import { ref, watch } from "vue";
import { api } from "@/api";
import { useTelegram } from "@/composables/useTelegram";

// Создаем глобальные переменные состояния, доступные между компонентами
const catCoinCount = ref(0);
const catClapCount = ref(0);
let syncInterval = null;

// Загружаем данные из localStorage при инициализации
try {
  const savedData = localStorage.getItem("catAppData");
  if (savedData) {
    const data = JSON.parse(savedData);
    catCoinCount.value = data.catCoinCount || 0;
    catClapCount.value = data.catClapCount || 0;
    console.log("Загрузка начальных данных из localStorage:", {
      coins: catCoinCount.value,
      claps: catClapCount.value,
    });
  }
} catch (err) {
  console.error("Ошибка при чтении начальных данных:", err);
}

export function useCoinsState() {
  const { userId } = useTelegram();

  // Сохранение данных в localStorage
  const saveToLocalStorage = () => {
    try {
      const dataToSave = {
        catCoinCount: catCoinCount.value,
        catClapCount: catClapCount.value,
        lastInteractionTime: Date.now(),
      };
      localStorage.setItem("catAppData", JSON.stringify(dataToSave));
      console.log("Данные сохранены в localStorage:", dataToSave);
    } catch (error) {
      console.error("Ошибка при сохранении данных:", error);
    }
  };

  // Обновление данных на сервере
  const updateServerData = async (forceUserId = null) => {
    const currentUserId = forceUserId || userId.value;
    if (!currentUserId) {
      console.log("Пропуск обновления на сервере: нет userId");
      return;
    }

    try {
      console.log(
        `Отправка обновления на сервер для пользователя ${currentUserId}:`,
        {
          coins_count: catCoinCount.value,
          claps_count: catClapCount.value,
        }
      );

      const result = await api.updateUser(currentUserId, {
        coins_count: catCoinCount.value,
        claps_count: catClapCount.value,
      });

      console.log("Данные успешно обновлены на сервере:", result);
      return result;
    } catch (error) {
      console.error("Ошибка при обновлении данных на сервере:", error);
      // Даже при ошибке продолжаем работать с локальными данными
    }
  };

  // Загрузка данных с приоритетом локальных значений
  const loadUserData = async (forceUserId = null) => {
    const currentUserId = forceUserId || userId.value;
    if (!currentUserId) {
      console.log("Пропуск загрузки с сервера: нет userId");
      return;
    }

    console.log(`Загрузка данных пользователя ${currentUserId}...`);
    try {
      const userData = await api.getUser(currentUserId);

      if (userData) {
        console.log("Получены данные с сервера:", userData);

        // Используем максимальное значение между сервером и localStorage
        const prevCoins = catCoinCount.value;
        const prevClaps = catClapCount.value;

        catCoinCount.value = Math.max(
          catCoinCount.value,
          userData.coins_count || 0
        );
        catClapCount.value = Math.max(
          catClapCount.value,
          userData.claps_count || 0
        );

        console.log("Обновленные значения после сравнения:", {
          coins: `${prevCoins} -> ${catCoinCount.value}`,
          claps: `${prevClaps} -> ${catClapCount.value}`,
        });

        // Сохраняем обновленные данные
        saveToLocalStorage();

        // Если наши данные больше, чем на сервере - отправляем обновление
        if (
          catCoinCount.value > (userData.coins_count || 0) ||
          catClapCount.value > (userData.claps_count || 0)
        ) {
          console.log("Локальные данные больше серверных, обновляем сервер");
          await updateServerData(currentUserId);
        }
      } else {
        console.log("Пользователь не найден на сервере или ошибка запроса");
      }
    } catch (err) {
      console.error("Ошибка при загрузке данных с сервера:", err);
    }
  };

  // Добавление монет
  const addCoins = (amount, forceUserId = null) => {
    const oldValue = catCoinCount.value;
    catCoinCount.value += amount;
    console.log(
      `Добавляем монеты: ${oldValue} + ${amount} = ${catCoinCount.value}`
    );

    saveToLocalStorage();
    updateServerData(forceUserId || userId.value); // Сразу обновляем на сервере
  };

  // Добавление хлопков
  const addClaps = (amount, forceUserId = null) => {
    const oldValue = catClapCount.value;
    catClapCount.value += amount;
    console.log(
      `Добавляем хлопки: ${oldValue} + ${amount} = ${catClapCount.value}`
    );

    saveToLocalStorage();
    updateServerData(forceUserId || userId.value); // Сразу обновляем на сервере
  };

  // Вычитание монет
  const removeCoins = (amount, forceUserId = null) => {
    const oldValue = catCoinCount.value;
    catCoinCount.value = Math.max(0, catCoinCount.value - amount);
    console.log(
      `Вычитаем монеты: ${oldValue} - ${amount} = ${catCoinCount.value}`
    );

    saveToLocalStorage();
    updateServerData(forceUserId || userId.value);
  };

  // Вычитание хлопков
  const removeClaps = (amount, forceUserId = null) => {
    const oldValue = catClapCount.value;
    catClapCount.value = Math.max(0, catClapCount.value - amount);
    console.log(
      `Вычитаем хлопки: ${oldValue} - ${amount} = ${catClapCount.value}`
    );

    saveToLocalStorage();
    updateServerData(forceUserId || userId.value);
  };

  // Настраиваем автоматическую синхронизацию каждые 30 секунд
  const startAutoSync = () => {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(() => {
      if (userId.value) {
        console.log("Автоматическая синхронизация с сервером...");
        updateServerData(userId.value);
      }
    }, 30000); // 30 секунд

    console.log("Автоматическая синхронизация запущена");
  };

  // Останавливаем авто-синхронизацию при уничтожении компонента
  const stopAutoSync = () => {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
      console.log("Автоматическая синхронизация остановлена");
    }
  };

  // Запускаем авто-синхронизацию
  startAutoSync();

  // Наблюдаем за изменением userId
  watch(
    () => userId.value,
    (newUserId) => {
      if (newUserId) {
        console.log(
          `ID пользователя изменился на ${newUserId}, перезагружаем данные`
        );
        loadUserData(newUserId);
      }
    }
  );

  return {
    catCoinCount,
    catClapCount,
    loadUserData,
    updateServerData,
    addCoins,
    addClaps,
    removeCoins,
    removeClaps,
    startAutoSync,
    stopAutoSync,
  };
}
