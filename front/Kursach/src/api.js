import axios from "axios";

// Используем только относительный путь для Cloudflare/nginx
const API_URL = '/api';

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("API базовый URL:", API_URL);

instance.interceptors.request.use(
  config => {
    console.log(`API запрос: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  error => Promise.reject(error)
);

export const api = {
  // Пользователь
  async getUser(userId) {
    try {
      const response = await instance.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  },

  async getUserByTelegramId(telegramId) {
    try {
      const response = await instance.get(`/users/telegram/${telegramId}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      console.error("Error fetching user by Telegram ID:", error);
      throw error;
    }
  },

  async createUserFromTelegram(userData) {
    try {
      const userResponse = await instance.post("/users", {
        nickname: userData.first_name || userData.username || "Пользователь Telegram",
        username: userData.username || `tg_${userData.id}`,
        telegram_id: userData.id,
        avatar: userData.photo_url || "/images/default_avatar.png",
        coins_count: 75,
        claps_count: 0,
      });

      if (!userResponse.data || !userResponse.data._id) {
        throw new Error("Не удалось создать пользователя");
      }

      const userId = userResponse.data._id;

      try {
        const randomCatResponse = await instance.get("/cats/random", {
          params: { rarity: "common" },
        });

        if (randomCatResponse.data && randomCatResponse.data._id) {
          const randomCat = randomCatResponse.data;

          await this.addCatToUser(userId, {
            cat_id: randomCat._id,
            name: randomCat.name,
            images: randomCat.images || {
              normal: randomCat.avatar || "/cat_avatars/normal/default.jpg",
              happy: "/cat_avatars/happy/default.jpg",
              sad: "/cat_avatars/sad/default.jpg",
            },
            color: randomCat.color || "Классический",
            purchase_date: new Date().toISOString(),
          });

          await this.setUserSelectedCat(userId, randomCat._id);

          localStorage.setItem(
            "selectedCat",
            JSON.stringify({
              id: randomCat._id,
              title: randomCat.name,
              images: randomCat.images || {
                normal: randomCat.avatar || "/cat_avatars/normal/default.jpg",
                happy: "/cat_avatars/happy/default.jpg",
                sad: "/cat_avatars/sad/default.jpg",
              },
            })
          );

          const adoptedCats = JSON.parse(
            localStorage.getItem("adoptedCats") || "[]"
          );
          adoptedCats.push({
            id: randomCat._id,
            title: randomCat.name,
            images: randomCat.images || {
              normal: randomCat.avatar || "/cat_avatars/normal/default.jpg",
              happy: "/cat_avatars/happy/default.jpg",
              sad: "/cat_avatars/sad/default.jpg",
            },
            color: randomCat.color || "Классический",
            dateAdopted: new Date().toISOString(),
          });
          localStorage.setItem("adoptedCats", JSON.stringify(adoptedCats));
        }
      } catch (catError) {
        console.error("Ошибка при выдаче случайного кота:", catError);
      }

      return userResponse.data;
    } catch (error) {
      console.error("Ошибка создания пользователя из Telegram:", error);
      throw error;
    }
  },

  async createUser(userData) {
    try {
      const response = await instance.post("/users", userData);
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  async updateUser(userId, data) {
    try {
      const response = await instance.put(`/users/${userId}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating user data:", error);
      throw error;
    }
  },

  async deleteUser(id) {
    try {
      const response = await instance.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  // Коты
  async getCats() {
    try {
      const response = await instance.get("/cats/");
      return response.data;
    } catch (error) {
      console.error("Error getting cats:", error);
      return [];
    }
  },

  async getCat(id) {
    try {
      const response = await instance.get(`/cats/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error getting cat:", error);
      throw error;
    }
  },

  async createCat(catData) {
    try {
      const response = await instance.post("/cats", catData);
      return response.data;
    } catch (error) {
      console.error("Error creating cat:", error);
      throw error;
    }
  },

  async updateCat(id, catData) {
    try {
      const response = await instance.put(`/cats/${id}`, catData);
      return response.data;
    } catch (error) {
      console.error("Error updating cat:", error);
      throw error;
    }
  },

  async deleteCat(id) {
    try {
      const response = await instance.delete(`/cats/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting cat:", error);
      throw error;
    }
  },

  async searchCats(query) {
    try {
      const response = await instance.get("/cats/search", {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error("Error searching cats:", error);
      throw error;
    }
  },

  // Друзья
  async addFriend(userId, friendId) {
    try {
      const response = await instance.post(`/users/${userId}/friends/${friendId}`);
      return response.data;
    } catch (error) {
      console.error("Error adding friend:", error);
      throw error;
    }
  },

  async removeFriend(userId, friendId) {
    try {
      const response = await instance.delete(`/users/${userId}/friends/${friendId}`);
      return response.data;
    } catch (error) {
      console.error("Error removing friend:", error);
      throw error;
    }
  },

  async getUserFriends(userId) {
    try {
      const response = await instance.get(`/users/${userId}/friends`);
      return response.data;
    } catch (error) {
      console.error("Error getting user friends:", error);
      throw error;
    }
  },

  // Топы
  async getTopUsers(period = "day", sortBy = "coins") {
    try {
      const response = await instance.get(`/users/top`, {
        params: { period, sort_by: sortBy }
      });
      return response.data;
    } catch (error) {
      console.error("Error getting top users:", error);
      throw error;
    }
  },

  async getTopDonations(period = "day") {
    try {
      const response = await instance.get(`/users/top/donations`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error("Error getting top donations:", error);
      throw error;
    }
  },

  // Магазин
  async purchaseCurrency(userId, type, amount) {
    try {
      const response = await instance.post(`/users/${userId}/purchase`, { 
        type, 
        amount 
      });
      return response.data;
    } catch (error) {
      console.error("Error purchasing currency:", error);
      throw error;
    }
  },

  // Донаты
  async makeDonation(userId, amount) {
    try {
      const response = await instance.post(`/users/${userId}/donate`, { amount });
      return response.data;
    } catch (error) {
      console.error("Error making donation:", error);
      throw error;
    }
  },

  // Коты пользователя
  async addCatToUser(userId, catData) {
    try {
      const response = await instance.post(`/users/${userId}/cats`, catData);
      return response.data;
    } catch (error) {
      console.error("Error adding cat to user:", error);
      throw error;
    }
  },
  
  async setUserSelectedCat(userId, catId) {
    try {
      const response = await instance.put(`/users/${userId}/selected-cat`, { 
        cat_id: catId 
      });
      return response.data;
    } catch (error) {
      console.error("Error setting selected cat:", error);
      throw error;
    }
  },

  async getAllUserCats() {
    try {
      const response = await instance.get(`/users/selected-cats`);
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении котов пользователей:", error);
      return [];
    }
  }
};