import {create} from 'zustand';

type User = {
    id: string
    firstName: string
    lastName: string
    email: string
    accessToken: string
    refreshToken: string
}

type UserState = {
    user: User | null
    login: (email: string, _password: string) => void
    logout: () => void
}

const useUserStore = create<UserState>((set) => ({
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
    login: (email: string, _password: string) => {
        const user = {
            id: '1',
            refreshToken: 'faketoken',
            accessToken: 'faketoken',
            email: email,
            firstName: 'John',
            lastName: 'Doe'
        };
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
    },
    logout: () => {
        localStorage.removeItem('user');
        set({user: null});
    },
}));

export default useUserStore;
