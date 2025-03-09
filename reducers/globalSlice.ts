import { createSlice } from "@reduxjs/toolkit";

import games from "../helpers/games";
import users from "../helpers/users";

export const globalSlice = createSlice({
    name: "global",
    initialState: {
        games: games,
        users: users
    },
    reducers: {
        toggleLikeGame: (state, action) => {
            const { game, activeUser } = action.payload;

            const userIndex = game.likes.indexOf(activeUser.id);

            const updatedGame = {
                ...game,
                likes: userIndex !== -1
                    ? game.likes.filter((like, i) => i !== userIndex)
                    : [...game.likes, activeUser.id]
            };

            const gameIndex = state.games.findIndex(g => g.id === game.id);

            const updatedGames = [ ...state.games ];
            
            updatedGames[gameIndex] = updatedGame;

            state.games = updatedGames;
        },
        toggleFollowUser: (state, action) => {
            const { user, activeUser } = action.payload;

            const activeUserIndex = user.followers.indexOf(activeUser.id);

            const updatedUser = {
                ...user,
                followers: activeUserIndex !== -1
                    ? user.followers.filter((user, i) => i !== activeUserIndex)
                    : [...user.followers, activeUser.id]
            };

            const selectedUserIndex = state.users.findIndex(u => u.id === user.id);

            const updatedUsers = [ ...state.users ];
            
            updatedUsers[selectedUserIndex] = updatedUser;

            state.users = updatedUsers;
        },
        addGame: (state, action) => {
            state.games = [...state.games, action.payload];
        },
    }
});

export const { toggleLikeGame, toggleFollowUser, addGame } = globalSlice.actions;

export default globalSlice.reducer;