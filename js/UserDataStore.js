class UserDataStore {
    static load() {
        try {
            const ownedData = JSON.parse(localStorage.getItem('ownedCharacters') || '[]');
            const favoriteData = JSON.parse(localStorage.getItem('favoriteCharacters') || '[]');

            return {
                owned: new Set(ownedData),
                favorites: new Set(favoriteData)
            };
        } catch (error) {
            console.warn('Error loading user data:', error);
            return {
                owned: new Set(),
                favorites: new Set()
            };
        }
    }

    static save({ owned, favorites }) {
        localStorage.setItem('ownedCharacters', JSON.stringify([...owned]));
        localStorage.setItem('favoriteCharacters', JSON.stringify([...favorites]));
    }

    static updateFavorite(characterId, isFavorite) {
        const data = this.load();

        if (isFavorite) {
            data.favorites.add(characterId);
        } else {
            data.favorites.delete(characterId);
        }

        this.save(data);
        return data;
    }

    static updateOwned(characterId, isOwned) {
        const data = this.load();

        if (isOwned) {
            data.owned.add(characterId);
        } else {
            data.owned.delete(characterId);
        }

        this.save(data);
        return data;
    }
}

window.UserDataStore = UserDataStore;
