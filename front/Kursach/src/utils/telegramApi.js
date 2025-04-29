/**
 * Безопасный доступ к объекту Telegram WebApp.
 */
export const telegram = window.Telegram?.WebApp;

/**
 * Инициализирует основные функции Telegram Mini App.
 * Вызывается один раз при старте приложения.
 */
export const initTelegramApp = () => {
  if (!telegram) {
    console.log("Не в среде Telegram Mini App.");
    return;
  }

  console.log("Инициализация Telegram Mini App...");

  // Сообщаем Telegram, что приложение готово к отображению
  telegram.ready();

  // Расширяем приложение на весь экран
  telegram.expand();

  // Включаем закрытие приложения свайпом
  telegram.enableClosingConfirmation();

  // Устанавливаем цветовую схему приложения в соответствии с темой Telegram
  document.documentElement.setAttribute('data-theme', telegram.colorScheme);
  telegram.onEvent('themeChanged', () => {
    document.documentElement.setAttribute('data-theme', telegram.colorScheme);
    // Здесь можно добавить логику для динамической смены темы в компонентах Vue
  });

  // Скрываем главную кнопку по умолчанию
  telegram.MainButton.hide();
};

/**
 * Получает данные пользователя из Telegram.
 * Возвращает null, если данные недоступны или не в среде Telegram.
 */
export const getUserData = () => {
  if (!telegram || !telegram.initDataUnsafe?.user) {
    return null;
  }
  // ВАЖНО: В реальном приложении используйте telegram.initData для валидации данных на бэкенде!
  // initDataUnsafe небезопасен для передачи на сервер без проверки.
  return telegram.initDataUnsafe.user;
};

/**
 * Показывает главную кнопку Telegram.
 * @param {string} text - Текст на кнопке.
 * @param {Function} onClick - Колбэк при нажатии.
 */
export const showMainButton = (text, onClick) => {
  if (!telegram) return;
  telegram.MainButton.setText(text);
  telegram.MainButton.show();
  // Удаляем предыдущий обработчик, чтобы избежать дублирования
  telegram.MainButton.offClick(onClick);
  telegram.MainButton.onClick(onClick);
};

/**
 * Скрывает главную кнопку Telegram и удаляет обработчик.
 * @param {Function} [onClick] - Колбэк, который нужно удалить (если известен).
 */
export const hideMainButton = (onClick) => {
  if (!telegram) return;
  if (onClick) {
    telegram.MainButton.offClick(onClick);
  }
  telegram.MainButton.hide();
};

/**
 * Открывает ссылку для шаринга в Telegram.
 * @param {string} url - URL для шаринга.
 * @param {string} text - Текст для шаринга.
 */
export const shareLink = (url, text) => {
  if (!telegram) return;
  telegram.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
};

/**
 * Отправляет данные боту (если настроено).
 * @param {any} data - Данные для отправки.
 */
export const sendDataToBot = (data) => {
    if (!telegram) return;
    telegram.sendData(JSON.stringify(data));
};