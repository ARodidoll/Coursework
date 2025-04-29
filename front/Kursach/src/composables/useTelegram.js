import { ref, readonly, computed, onMounted, onUnmounted } from 'vue';
import { telegram, getUserData as fetchUserData, showMainButton as tgShowMainButton, hideMainButton as tgHideMainButton, shareLink as tgShareLink, sendDataToBot as tgSendData } from '@/utils/telegramApi';

const isTelegram = ref(!!telegram);
const telegramUser = ref(null);
const platform = ref(telegram?.platform || 'unknown'); // 'tdesktop', 'macos', 'ios', 'android', etc.
const themeParams = ref(telegram?.themeParams || {});

const updateTheme = () => {
  if (telegram) {
    themeParams.value = telegram.themeParams;
    document.documentElement.setAttribute('data-theme', telegram.colorScheme);
  }
};

export function useTelegram() {
  if (!telegramUser.value && isTelegram.value) {
    telegramUser.value = fetchUserData();
  }

  onMounted(() => {
    if (isTelegram.value) {
      telegram.onEvent('themeChanged', updateTheme);
      updateTheme(); // Initial theme set
    }
  });

  onUnmounted(() => {
    if (isTelegram.value) {
      telegram.offEvent('themeChanged', updateTheme);
    }
  });

  // Генерируем ID пользователя: приоритет Telegram ID, затем localStorage, затем генерация
  const userId = computed(() => {
    if (telegramUser.value?.id) {
      // Преобразуем ID Telegram в строку для единообразия
      return `tg_${telegramUser.value.id}`;
    }
    let localId = localStorage.getItem('userId');
    if (!localId) {
      localId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('userId', localId);
    }
    return localId;
  });

  // Безопасный доступ к данным пользователя
  const user = computed(() => telegramUser.value);

  return {
    isTelegram: readonly(isTelegram),
    telegram, // Прямой доступ к объекту TG (использовать осторожно)
    user,
    userId,
    platform: readonly(platform),
    themeParams: readonly(themeParams),
    showMainButton: tgShowMainButton,
    hideMainButton: tgHideMainButton,
    shareLink: tgShareLink,
    sendData: tgSendData,
  };
}