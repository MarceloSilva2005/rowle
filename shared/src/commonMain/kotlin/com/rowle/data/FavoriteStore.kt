package com.rowle.data

import androidx.compose.runtime.Composable

interface FavoriteStore {
    fun load(): Set<String>
    fun save(ids: Set<String>)
}

@Composable
expect fun rememberFavoriteStore(): FavoriteStore
