import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },
      
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      updateUser: (userData) => {
        set((state) => ({ user: { ...state.user, ...userData } }));
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useProgressStore = create((set) => ({
  overview: null,
  currentLessonProgress: null,
  
  setOverview: (overview) => set({ overview }),
  
  setCurrentLessonProgress: (progress) => set({ currentLessonProgress: progress }),
  
  updateLessonProgress: (lessonId, progressData) => {
    set((state) => {
      if (state.currentLessonProgress?.lesson_id === lessonId) {
        return {
          currentLessonProgress: {
            ...state.currentLessonProgress,
            ...progressData,
          },
        };
      }
      return state;
    });
  },
}));
