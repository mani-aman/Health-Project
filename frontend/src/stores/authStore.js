import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createWithEqualityFn } from "zustand/traditional";
import toast from "react-hot-toast";
import api from "../services/api.js";

export const useAuthStore = createWithEqualityFn(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const { token } = get();
          if (token) {
            const { data } = await api.get("/users/profile");
            set({ user: data });
          }
        } catch {
          set({ token: null, user: null });
        } finally {
          set({ isLoading: false });
        }
      },
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/login", credentials);
          set({ token: data.token, user: data.user });
          toast.success("Login successful!");
          return data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Login failed");
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      signup: async (userData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/signup", userData);
          set({ token: data.token, user: data.user });
          toast.success("Account created!");
          return data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Signup failed");
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      setAuth: (token, user) => {
        set({ token, user });
      },
      logout: () => {
        set({ user: null, token: null });
        toast.success("Logged out");
      },
    }),
    {
      name: "healthai-auth",
      partialize: (state) => ({ token: state.token }),
    },
  ),
);
